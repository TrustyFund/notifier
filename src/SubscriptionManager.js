const { Apis } = require('bitsharesjs-ws');
const { key } = require('bitsharesjs');
const { decryptMemo } = require('./Utils');
const config = require('../config');

class SubscriptionManager {
  constructor(types) {
    this.types = types;
    this.subscribedUsers = {};
    this.skippedUsers = {};
  }

  getClientsIds() {
    const returnIds = [];
    Object.keys(this.subscribedUsers).forEach((userId) => {
      this.types.forEach((destinationType) => {
        if (this.subscribedUsers[userId][destinationType].length) {
          returnIds.push(userId);
        }
      });
    });

    return returnIds;
  }

  removeClient(clientId, destinationType, destination) {
    if (this.subscribedUsers[clientId][destinationType].includes(destination)) {
      this.subscribedUsers[clientId][destinationType].splice(this.subscribedUsers[clientId][destinationType].indexOf(destination), 1);
    }
  }

  setUserArrays(clientId) {
    this.subscribedUsers[clientId] = {};
    this.skippedUsers[clientId] = {};
    this.types.forEach((destinationType) => {
      this.subscribedUsers[clientId][destinationType] = [];
      this.skippedUsers[clientId][destinationType] = [];
    });
  }

  addClient(clientId, destinationType, destination, recount) {
    if (this.subscribedUsers[clientId] === undefined) {
      this.setUserArrays(clientId);
    }
    if (!recount && this.skippedUsers[clientId][destinationType].includes(destination)) {
      return;
    }
    this.subscribedUsers[clientId][destinationType].push(destination);
  }

  skipClient(clientId, destinationType, destination) {
    if (this.subscribedUsers[clientId] === undefined) {
      this.setUserArrays(clientId);
    }
    this.skippedUsers[clientId][destinationType].push(destination);
  }

  processSubscription(transfer, recount) {
    if (transfer.memo) {
      const message = decryptMemo(this.neededKeyToDecrypt, transfer.memo);
      const clientId = transfer.from;

      this.types.forEach((destinationType, index) => {
        const messageParts = message.split(config.unsubscribeDevider);
        if (messageParts.length === 1) {
          const destination = messageParts[0];
          if (transfer.amount.asset_id === config.assetToSubscribe && (transfer.amount.amount >= config.amountToSubscribe)) {
            if (destination.includes(config.deliveryIdentification[index])) {
              this.addClient(clientId, destinationType, destination, recount);
            }
            if (destinationType === 'telegram') {
              if (!Number.isNaN(parseInt(message, 10))) {
                this.addClient(clientId, destinationType, destination, recount);
              }
            }
          }
        } else if (messageParts.length === 2) {
          const [stopMessage, destination] = messageParts;
          if (stopMessage === 'stop') {
            if (recount) {
              this.removeClient(clientId, destinationType, destination);
            } else {
              this.skipClient(clientId, destinationType, destination);
            }
          }
        }
      });
    }
    return this.subscribedUsers;
  }

  async setServiceUser(brainkey) {
    const normalizedBrainkey = key.normalize_brainKey(brainkey);
    const ownerKey = key.get_brainPrivateKey(normalizedBrainkey, 1);
    this.ownerKey = ownerKey;
    const ownerPubkey = ownerKey.toPublicKey().toPublicKeyString();
    const [[userId]] = await Apis.instance().db_api().exec('get_key_references', [[ownerPubkey]]);
    this.activeKey = key.get_brainPrivateKey(normalizedBrainkey, 0);
    const activePubkey = this.activeKey.toPublicKey().toPublicKeyString();
    const [user] = await Apis.instance().db_api().exec('get_accounts', [[userId]]);
    const memoKey = user.options.memo_key;
    let neededKeyToDecrypt;
    if (memoKey === ownerPubkey) {
      neededKeyToDecrypt = this.ownerKey;
    }
    if (memoKey === activePubkey) {
      neededKeyToDecrypt = this.activeKey;
    }
    this.neededKeyToDecrypt = neededKeyToDecrypt;
    this.serviceUserId = userId;
    return userId;
  }

  async getActiveSubscriptions() {
    const allHistory = await this.getAllHistory();
    allHistory.forEach((item) => {
      this.processSubscription(item.op[1], false);
    });
    return this.subscribedUsers;
  }

  async getAllHistory() {
    const allHistory = [];

    // Because of bitshares fetching from new to old, we need to ensure that no messages missed
    let fromId = '1.11.999999999';

    // We need await in loop because each request depends on previous
    // eslint-disable-next-line no-await-in-loop
    for (;;) {
      const history = await this.getSegmentHistory(fromId);
      if ((allHistory.length > 0 && history[0].id === allHistory[allHistory.length - 1].id) || !history.length) {
        break;
      }
      allHistory.push(...history);
      fromId = allHistory[allHistory.length - 1].id;
    }
    return allHistory;
  }

  getSegmentHistory(fromId, toId = '1.11.0') {
    return Apis.instance().history_api().exec('get_account_history_operations', [this.serviceUserId, 0, fromId, toId, 100]);
  }
}

module.exports = SubscriptionManager;
