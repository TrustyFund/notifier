const {Apis} = require('bitsharesjs-ws');
const {PrivateKey, key} = require('bitsharesjs');

const seed = "glink omental webless pschent knopper brumous scarry were wasting isopod raper barbas maco kirn tegua mitome";
const normalized = key.normalize_brainKey(seed);

const ownerKey = key.get_brainPrivateKey(normalized , 1);
const ownerPubkey = ownerKey.toPublicKey().toPublicKeyString();


console.log("\n normalized:",normalized);
console.log("\nPrivate key:",ownerKey.toWif());
console.log("Public key :", ownerPubkey, "\n");

/*
Apis.instance('wss://dex.rnglab.org/ws', true).init_promise.then(() => {
	Apis.instance().db_api().exec('get_key_references', [[ownerPubkey]])
    .then(([[userId]]) => {
      console.log(userId);
    });
});*/