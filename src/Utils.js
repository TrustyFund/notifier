const { Aes } = require('bitsharesjs');

function getRealCost(amount, precision) {
  return Math.abs(amount / (10 ** precision));
}

function formatPrice(price, base, quote) {
  const precisionDifference = base.precision - quote.precision;
  const realPrice = (precisionDifference > 0) ? price / (10 ** precisionDifference) : price * (10 ** -precisionDifference);
  return Math.abs(realPrice).toFixed(7);
}

function decryptMemo(privKey, memo) {
  return Aes.decrypt_with_checksum(
    privKey,
    memo.from,
    memo.nonce,
    memo.message
  ).toString('utf-8');
}

function mergeUniq(...args) {
  const hash = {};
  const arr = [];
  for (let i = 0; i < args.length; i += 1) {
    for (let j = 0; j < args[i].length; j += 1) {
      if (hash[args[i][j]] !== true) {
        arr[arr.length] = args[i][j];
        hash[args[i][j]] = true;
      }
    }
  }
  return arr;
}

module.exports = {
  getRealCost,
  formatPrice,
  mergeUniq,
  decryptMemo
};
