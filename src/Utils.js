const fs = require('fs');
const { Aes } = require('bitsharesjs');

function getRealCost(amount, precision) {
  return Math.abs(amount / (10 ** precision)).toFixed(9);
}

function writeToFile(data) {
  fs.appendFile('orders_fill_log', data + '\n\n', (error) => {
    if (error) throw error;
  });
}

function formatPrice(price, base, quote) {
  const precisionDifference = base.precision - quote.precision;
  const realPrice = (precisionDifference > 0) ? price / (10 ** precisionDifference) : price * (10 ** -precisionDifference);
  return Math.abs(realPrice).toFixed(7);
}

function decryptMemo(privateKey, memo) {
  return Aes.decrypt_with_checksum(
    privateKey,
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
  writeToFile,
  formatPrice,
  mergeUniq,
  decryptMemo
};
