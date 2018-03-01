const { Apis } = require('bitsharesjs-ws');
const { getRealCost, formatPrice } = require('./Utils');
const config = require('../config');

const defaultAssets = ['BTS', 'BTC', 'OPEN.BTC'];


class OperationListener {
  constructor(usersIds) {
    this.usersIds = usersIds;
    Apis.instance().db_api().exec('set_subscribe_callback', [this.subsribeCallback.bind(this), true]);
    Apis.instance().db_api().exec('lookup_asset_symbols', [defaultAssets]).then(assetObjects => {
      this.setDefaultAssets(assetObjects);
    });
  }

  updateSubscribedUsers(newUsersIds) {
    this.usersIds = newUsersIds;
  }

  setDefaultAssets(assets) {
    this.fetchedAssets = assets;
  }

  setEventCallback(callback) {
    this.eventCallback = callback;
  }

  subsribeCallback([operations]) {
    operations.forEach((operation) => {
      this.checkOperation(operation);
    });
  }

  async checkOperation(operation) {
    if (operation.id) {
      if (operation.id.includes('1.11.')) {
        const [operationId, payload] = operation.op;
        const dict = { 0: 'transfer', 4: 'fill_order' };
        const opType = dict[operationId];

        const filter = {
          transfer: { user_field: 'to', callback: this.processTransfer.bind(this) },
          fill_order: { user_field: 'account_id', callback: this.processFillOrder.bind(this) }
        };

        if (opType !== undefined) {
          if ((filter[opType] !== undefined) && (this.usersIds.indexOf(payload[filter[opType].user_field]) > -1)) {
            const message = await filter[opType].callback(operation);
            if (message) {
              this.eventCallback({
                userId: payload[filter[opType].user_field],
                type: opType,
                message,
                payload
              });
            }
          }
        }
      }
    }
  }

  async processTransfer(source) {
    const operation = source.op[1];
    const transferAsset = await this.findAsset(operation.amount.asset_id);
    const value = getRealCost(operation.amount.amount, transferAsset.precision);
    const userFromId = operation.from;
    const userToId = operation.to;
    const [userFrom, userTo] = await this.getUsers([userFromId, userToId]);
    return { subject: config.templates.transfer.subject, body: config.templates.transfer.body(userFrom.name, userTo.name, value, transferAsset.symbol) };
  }

  async processFillOrder(source) {
    const blockNum = source.block_num;
    const trxInBlock = source.trx_in_block;

    const operation = source.op[1];

    const order = await Apis.instance().db_api().exec('get_objects', [[operation.order_id]]);
    if (order[0] != null) {
      return false;
    }

    // We need it to identify direction (bought, sold)
    const { transactions } = await Apis.instance().db_api().exec('get_block', [blockNum]);
    const myTransaction = transactions[trxInBlock];

    const userId = myTransaction.operations[0][1].seller;
    const [user] = await this.getUsers([userId]);

    const isBid = myTransaction.operations[0][1].amount_to_sell.asset_id === myTransaction.operations[0][1].fee.asset_id;

    const priceBase = (isBid) ? operation.receives : operation.pays;
    const priceQuote = (isBid) ? operation.pays : operation.receives;
    const amount = isBid ? operation.receives : operation.pays;

    const receivedAmount = operation.fee.asset_id === amount.asset_id ? amount.amount - operation.fee.amount : amount.amount;

    const fillOrderSide = isBid ? 'bought' : 'sold';

    const orderAsset = await this.findAsset(amount.asset_id);
    const orderValue = { amount: getRealCost(receivedAmount, orderAsset.precision), symbol: orderAsset.symbol };

    const baseAsset = await this.findAsset(priceBase.asset_id);
    const quoteAsset = await this.findAsset(priceQuote.asset_id);
    const price = formatPrice(priceBase.amount / priceQuote.amount, baseAsset, quoteAsset);
    return {
      subject: config.templates.fill_order.subject,
      body: config.templates.fill_order.body(user.name, fillOrderSide, orderValue.amount, orderValue.symbol, price, baseAsset.symbol, quoteAsset.symbol)
    };
  }

  async findAsset(assetId) {
    let foundAsset;
    this.fetchedAssets.forEach((asset) => {
      if (asset.id === assetId) {
        foundAsset = asset;
      }
    });

    if (foundAsset === undefined) {
      [foundAsset] = await Apis.instance().db_api().exec('lookup_asset_symbols', [[assetId]]);
    }
    return foundAsset;
  }

  async getUsers(usersIds) {
    const users = await Apis.instance().db_api().exec('get_objects', [usersIds]);
    return users;
  }
}


module.exports = OperationListener;
