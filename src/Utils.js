const fs = require('fs');

getRealCost(amount, precision) {
  return Math.abs(amount / (10 ** precision)).toFixed(9);
}

writeToFile(data) {
  fs.appendFile('block_log', data + '\n\n', (error) => {
    if (error) throw error;
  })
}

formatPrice(price,base,quote){
  let precision_diff = base.precision - quote.precision;
  price = (precision_diff > 0) ? price / Math.pow(10,precision_diff) : price * Math.pow(10,-precision_diff);    
  return Math.abs(price).toFixed(7);
}
      

module.exports = {getRealCost,getMarketID,writeToFile, formatPrice};
