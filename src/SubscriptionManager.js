const { Apis } = require('bitsharesjs-ws');
const { key } = require('bitsharesjs');
const { mergeUniq, decryptMemo } = require('./Utils');


class SubscriptionManager {
  constructor(types) {
    this.types = types;
    this.subscribedUsers = {};
    this.unsubscribedUsers = {};
    this.destinations = {};

    types.forEach((item) => {
      this.subscribedUsers[item] = [];
      this.unsubscribedUsers[item] = [];
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
      if (item.op[1].memo) {
        const message = decryptMemo(this.ownerKey, item.op[1].memo);
        const clientId = item.op[1].from;
        const [action, ...data] = message.split(':');
        if (action && data) {
          // Need to join rightside because android token has same devider
          const fullData = data.join('');
          if (action === 'stop' && this.types.includes(fullData)) {
            this.unsubscribedUsers[fullData].push(clientId);
          }
          if (this.types.includes(action) && !this.unsubscribedUsers[action].includes(clientId) && !this.subscribedUsers[action].includes(clientId)) {
            this.subscribedUsers[action].push(clientId);
            this.destinations[action][clientId] = fullData;
          }
        }
      }
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
