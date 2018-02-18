const { Apis } = require('bitsharesjs-ws');
const { key, Aes } = require('bitsharesjs');


class SubscriptionManager {
  constructor(brainkey) {
    this.brainkey = brainkey;
  }

  setServiceUserId(userId) {
    this.serviceUserId = userId;
  }

  async getServiceUserId() {
    const normalizedBrainkey = key.normalize_brainKey(this.brainkey);
    const ownerKey = key.get_brainPrivateKey(normalizedBrainkey, 1);
    const ownerPubkey = ownerKey.toPublicKey().toPublicKeyString();
    const [[userId]] = await Apis.instance().db_api().exec('get_key_references', [[ownerPubkey]]);
    this.setServiceUserId(userId);
    return userId;
  }

  async getActiveSubscriptions() {
    const allHistory = await this.getAllHistory();
    return allHistory;
  }

  async getAllHistory() {
    const allHistory = [];
    let fromId = '1.11.999999999';
    // We need await in loop becaouse each request depends on previous
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
