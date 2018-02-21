module.exports = {
  emailTransport: { user: 'user', pass: 'pass', service: 'service' },
  serviceUserBrainkey: 'your service user brainkey',
  defaultAssets: ['BTS', 'OPEN.EOS', 'USD', 'OPEN.OMG', 'CNY',
    'OPEN.LTC', 'TRFND', 'OPEN.BTC'],
  deliveryMethods: ['email'],
  // It is 100 BTS
  assetToSubscribe: '1.3.0',
  amountToSubscribe: 0,
  bitsharesNodes: [
    'wss://bitshares.openledger.info/ws',
    'wss://eu.openledger.info/ws',
    'wss://bit.btsabc.org/ws',
    'wss://bts.ai.la/ws',
    'wss://bitshares.apasia.tech/ws',
    'wss://japan.bitshares.apasia.tech/ws',
    'wss://bitshares.dacplay.org/ws',
    'wss://bitshares-api.wancloud.io/ws',
    'wss://openledger.hk/ws',
    'wss://bitshares.crypto.fans/ws',
    'wss://ws.gdex.top',
    'wss://dex.rnglab.org',
    'wss://dexnode.net/ws',
    'wss://kc-us-dex.xeldal.com/ws',
    'wss://btsza.co.za:8091/ws',
    'wss://api.bts.blckchnd.com',
    'wss://eu.nodes.bitshares.ws',
    'wss://us.nodes.bitshares.ws',
    'wss://sg.nodes.bitshares.ws',
    'wss://ws.winex.pro'
  ]
};
