const {Apis} = require('bitsharesjs-ws');
const {PrivateKey, key, Aes} = require('bitsharesjs');

const brainkey = "glink omental webless pschent knopper brumous scarry were wasting isopod raper barbas maco kirn tegua mitome";
const password = '111111111';

const passwordAes = Aes.fromSeed(password);
const encryptionBuffer = key.get_random_key().toBuffer();
const encryptionKey = passwordAes.encryptToHex(encryptionBuffer);
const aesPrivate = Aes.fromSeed(encryptionBuffer);

const normalizedBrainkey = key.normalize_brainKey(brainkey);
// const brainkeyPrivate = PrivateKey.fromSeed(normalizedBrainkey);
const encryptedBrainkey = aesPrivate.encryptToHex(normalizedBrainkey);
const passwordPrivate = PrivateKey.fromSeed(password);
const passwordPubkey = passwordPrivate.toPublicKey().toPublicKeyString();

// getting user id
const ownerKeyIndex = 1;
const ownerKey = key.get_brainPrivateKey(normalizedBrainkey, ownerKeyIndex);
const ownerPubkey = ownerKey.toPublicKey().toPublicKeyString();


console.log("\nPrivate key:",ownerKey.toWif());
console.log("Public key :", ownerPubkey, "\n");

/*
Apis.instance('wss://dex.rnglab.org/ws', true).init_promise.then(() => {
	Apis.instance().db_api().exec('get_key_references', [[ownerPubkey]])
    .then(([[userId]]) => {
      console.log(userId);
    });
});*/