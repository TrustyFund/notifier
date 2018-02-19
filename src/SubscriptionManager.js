const { Apis } = require('bitsharesjs-ws');
const { key, Aes } = require('bitsharesjs');


class SubscriptionManager {
  async setServiceUser(brainkey) {
    const normalizedBrainkey = key.normalize_brainKey(brainkey);
    const ownerKey = key.get_brainPrivateKey(normalizedBrainkey, 1);
    const ownerPubkey = ownerKey.toPublicKey().toPublicKeyString();
    const [[userId]] = await Apis.instance().db_api().exec('get_key_references', [[ownerPubkey]]);
    this.serviceUserId = userId;
    this.ownerKey = ownerKey;
    return userId;
  }

  async getActiveSubscriptions(types) {
    const allHistory = await this.getAllHistory();
    let subscribedUsers = {};
    let unsubscribedUsers = {};
    let destinations = {};

    types.forEach((item) => {
      subscribedUsers[item] = [];
      unsubscribedUsers[item] = [];
      destinations[item] = {};
    })

    allHistory.forEach((item) => {
      if (item.op[1].memo){
        const message = decryptMemo(this.ownerKey, item.op[1].memo);
        const clientId = item.op[1].from;
        let [action,...data] = message.split(':');
        if (action && data) {
          // Need to join rightside because android token has same devider
          data = data.join('');
          if (action === 'stop' && types.includes(data)) {
            unsubscribedUsers[data].push(clientId);
          } 
          if (types.includes(action) && !unsubscribedUsers[action].includes(clientId) && !subscribedUsers[action].includes(clientId)){
            subscribedUsers[action].push(clientId);
            destinations[action][clientId] = data;
          }
        }
      }
    });
    return destinations;
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

function decryptMemo(privateKey, memo) {
  return Aes.decrypt_with_checksum(
    privateKey,
    memo.from,
    memo.nonce,
    memo.message
  ).toString('utf-8');
}

module.exports = SubscriptionManager;
