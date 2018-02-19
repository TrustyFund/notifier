const fs = require('fs');


class Utils {
	getRealCost(amount, precision) {
		return Math.abs(amount / (10 ** precision)).toFixed(9);
	}

	getMarketID(base, quote) {
        if (!base || !quote) return {marketId: "_"};
        let baseID = parseInt(base.get("id").split(".")[2], 10);
        let quoteID = parseInt(quote.get("id").split(".")[2], 10);
        const marketID = quoteID > baseID ? `${quote.get("symbol")}_${base.get("symbol")}` : `${base.get("symbol")}_${quote.get("symbol")}`;
        return {baseID, quoteID, marketID, first: quoteID > baseID ? quote : base, second: quoteID > baseID ? base : quote};
    }

    isAsk(order, base) {
        const baseId = base ? base.get('id') : base.id;

        if (order.sell_price) {
            return order.sell_price.quote.asset_id === baseId;
        } else if (order.call_price) {
            return order.call_price.quote.asset_id === baseId;
        }
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

}

module.exports = Utils;
