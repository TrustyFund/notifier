const { Apis } = require('bitsharesjs-ws');
const { key, Aes } = require('bitsharesjs');

const brainkey = 'fantast batch cisele usage genipap tibia eloper tawie rain sailor angel snotty pale precast unken cadbit';

function getAccountHistory(userId) {
  return Apis.instance().history_api().exec('get_account_history_operations', [userId, 0, '1.11.0', '1.11.0', 100]);
}

function decryptMemo(privateKey, memo) {
  return Aes.decrypt_with_checksum(
    privateKey,
    memo.from,
    memo.nonce,
    memo.message,
    true
  ).toString('utf-8');
}


Apis.instance('wss://dex.rnglab.org/ws', true).init_promise.then(() => {
  const normalizedBrainkey = key.normalize_brainKey(brainkey);
  const ownerKey = key.get_brainPrivateKey(normalizedBrainkey, 1);
  const ownerPubkey = ownerKey.toPublicKey().toPublicKeyString();
  console.log('\n Account Pubkey: ', ownerPubkey, '\n');

  Apis.instance().db_api().exec('get_key_references', [[ownerPubkey]])
    .then(([[userId]]) => {
      if (userId) {
        getAccountHistory(userId).then((history) => {
          history.forEach((item) => {
            if (item.op[1].memo) {
              console.log(decryptMemo(ownerKey,item.op[1].memo));
            }
          });
        });
      } else {
        console.log('No user found for this brainkey');
      }
    });
});


