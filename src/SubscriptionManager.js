const { Apis } = require('bitsharesjs-ws');
const { key } = require('bitsharesjs');
const { mergeUniq, decryptMemo } = require('./Utils');
const config = require('../config');

class SubscriptionManager {
  constructor(types) {
    this.types = types;
    this.subscribedUsers = {};
    this.skipUsers = {};
    this.destinations = {};

    types.forEach((item) => {
      this.subscribedUsers[item] = [];
      this.skipUsers[item] = [];
      this.destinations[item] = {};
    });
  }

  getClientsIds() {
    let clientsIds = [];
    this.types.forEach((destinationType) => {
      clientsIds = mergeUniq(clientsIds, this.subscribedUsers[destinationType]);
    });
    return clientsIds;
  }

  removeClient(destinationType, clientId) {
    this.subscribedUsers[destinationType].splice(this.subscribedUsers[destinationType].indexOf(clientId), 1);
    delete this.destinations[destinationType][clientId];
  }

  addClient(destinationType, clientId, destination, recount) {
    if (!recount && this.skipUsers[destinationType].includes(clientId)) {
      return;
    }
    this.subscribedUsers[destinationType].push(clientId);
    this.destinations[destinationType][clientId] = destination;
  }

  skipClient(destinationType, clientId) {
    this.skipUsers[destinationType].push(clientId);
  }

  processSubscription(transfer, recount) {
    if (transfer.memo) {
      const message = decryptMemo(this.ownerKey, transfer.memo);
      const clientId = transfer.from;
      const [destinationType, ...data] = message.split(':');
      if (destinationType && data && this.types.includes(destinationType)) {
        // Need to join rightside because android token has same devider
        const destination = data.join('');
        if (destination === 'stop') {
          if (recount) {
            this.removeClient(destinationType, clientId);
          } else {
            this.skipClient(destinationType, clientId);
          }
        } else if (transfer.amount.asset_id === config.assetToSubscribe && (transfer.amount.amount >= config.amountToSubscribe)) {
          this.addClient(destinationType, clientId, destination, recount);
        }
      }
    }
    return this.destinations;
  }

  async setServiceUser(brainkey) {
    const normalizedBrainkey = key.normalize_brainKey(brainkey);
    const ownerKey = key.get_brainPrivateKey(normalizedBrainkey, 1);
    const ownerPubkey = ownerKey.toPublicKey().toPublicKeyString();
    const [[userId]] = await Apis.instance().db_api().exec('get_key_references', [[ownerPubkey]]);
    this.serviceUserId = userId;
    this.ownerKey = ownerKey;
    return userId;
  }

  async getActiveSubscriptions() {
    const allHistory = await this.getAllHistory();
    allHistory.forEach((item) => {
      this.processSubscription(item.op[1], false);
    });
    return this.destinations;
  }

  async getAllHistory() {
    const allHistory = [];

    // Because of bitshares fetching from new to old, we need to ensure that no messages missed
    let fromId = '1.11.999999999';

    // We need await in loop because each request depends on previous
    // eslint-disable-next-line no-await-in-loop
    for (;;) {
      const history = await this.getSegmentHistory(fromId);
      allHistory.push(...history);
      if ((allHistory.length > 0 && history[0].id === allHistory[allHistory.length - 1].id) || !history.length) {
        break;
      }
      fromId = allHistory[allHistory.length - 1].id;
    }
    return allHistory;
  }

  getSegmentHistory(fromId, toId = '1.11.0') {
    return Apis.instance().history_api().exec('get_account_history_operations', [this.serviceUserId, 0, fromId, toId, 100]);
  }
}

module.exports = SubscriptionManager;
