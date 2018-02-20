const { Apis } = require('bitsharesjs-ws');
const { getRealCost, formatPrice } = require('./Utils');

const defaultAssets = ['BTS', 'BTC', 'OPEN.BTC'];



//const tempFill='{"id":"1.11.140672464","op":[4,{"fee":{"amount":0,"asset_id":"1.3.0"},"order_id":"1.7.55133591","account_id":"1.2.512210","pays":{"amount":631520,"asset_id":"1.3.113"},"receives":{"amount":3774330,"asset_id":"1.3.0"},"fill_price":{"base":{"amount":1673200,"asset_id":"1.3.113"},"quote":{"amount":10000000,"asset_id":"1.3.0"}},"is_maker":true}],"result":[0,{}],"block_num":24524192,"trx_in_block":19,"op_in_trx":2,"virtual_op":45428}';

class OperationListener {
  constructor(usersIds) {
    this.usersIds = usersIds;
    Apis.instance().db_api().exec('set_subscribe_callback', [this.subsribeCallback.bind(this), true]);
    Apis.instance().db_api().exec('lookup_asset_symbols', [defaultAssets]).then(assetObjects => {
      this.setDefaultAssets(assetObjects);
    });
  }

  addUser(id) {
    if (this.usersIds.indexOf(id) === -1) {
      this.usersIds.push(id);
    }
  }

  removeUser(id) {
    if (this.usersIds.indexOf(id) > -1) {
      this.usersIds.splice(this.usersIds.indexOf(id), 1);
    }
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
          transfer: { user_field: 'to', callback: this.retreiveTransfer.bind(this) },
          fill_order: { user_field: 'account_id', callback: this.retreiveFillOrder.bind(this) }
        };

        if (opType !== undefined) {
          if ((filter[opType] !== undefined) && (this.usersIds.indexOf(payload[filter[opType].user_field]) > -1)) {
            const message = await filter[opType].callback(operation);
            if (message) {
              console.log('operation user: ' + payload[filter[opType].user_field]);
              console.log('return message: ' + JSON.stringify(message));
              this.eventCallback({ userId: payload[filter[opType].user_field], message });
            }
          }
        }
      }
    }
  }

  async retreiveTransfer(source) {
    const operation = source.op[1];
    const transferAsset = this.findAsset(operation.amount.asset_id);
    const value = getRealCost(operation.amount.amount, transferAsset.precision);
    const message = { subject: 'Bitshares transfer', body: `You have been transferred ${transferAsset.symbol} ${value}` };
    return message;
  }

  async retreiveFillOrder(source) {
    const blockNum = source.block_num;
    const trxInBlock = source.trx_in_block;


    const operation = source.op[1];

    const order = await Apis.instance().db_api().exec('get_objects', [[operation.order_id]]);
    console.log(order);
    if (order[0] != null) {
      return false;
    }

    const { transactions } = await Apis.instance().db_api().exec('get_block', [blockNum]);
    const myTransaction = transactions[trxInBlock];

    const isBid = myTransaction.operations[0][1].amount_to_sell.asset_id === myTransaction.operations[0][1].fee.asset_id;

    const priceBase = (isBid) ? operation.receives : operation.pays;
    const priceQuote = (isBid) ? operation.pays : operation.receives;
    const amount = isBid ? operation.receives : operation.pays;

    const receivedAmount = operation.fee.asset_id === amount.asset_id ? amount.amount - operation.fee.amount : amount.amount;

    const fillOrderSide = isBid ? 'buy' : 'sell';

    const orderAsset = this.findAsset(amount.asset_id);
    const orderValue = { amount: getRealCost(receivedAmount, orderAsset.precision), symbol: this.findAsset(amount.asset_id).symbol };

    const baseAsset = this.findAsset(priceBase.asset_id);
    const quoteAsset = this.findAsset(priceQuote.asset_id);
    const price = formatPrice(priceBase.amount / priceQuote.amount, baseAsset, quoteAsset);
    const message = { subject: 'Close order', body: `${fillOrderSide} ${orderValue.amount} ${orderValue.symbol} at ${price} ${baseAsset.symbol}/${quoteAsset.symbol}` };
    return message;
  }

  findAsset(assetId) {
    let findAsset;
    this.fetchedAssets.forEach((asset) => {
      if (asset.id === assetId) {
        findAsset = asset;
      }
    });
    return findAsset !== undefined ? findAsset : assetId;
  }
}


module.exports = OperationListener;
