const {Apis} = require('bitsharesjs-ws');
const {PrivateKey, key, Aes} = require('bitsharesjs');

const brainkey = 'glink omental webless pschent knopper brumous scarry were wasting isopod raper barbas maco kirn tegua mitome';

Apis.instance('wss://dex.rnglab.org/ws', true).init_promise.then(() => {
	const normalizedBrainkey = key.normalize_brainKey(brainkey);
	const ownerKey = key.get_brainPrivateKey(normalizedBrainkey, 1);
	const ownerPubkey = ownerKey.toPublicKey().toPublicKeyString();

	Apis.instance().db_api().exec('get_key_references', [[ownerPubkey]])
    .then(([[userId]]) => {
      console.log(userId);
    });
});