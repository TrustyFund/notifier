const { Apis } = require('bitsharesjs-ws');


class ApiConnection {
  connect() {
    return Apis.instance('wss://dex.rnglab.org/ws', true).init_promise;
  }
}

module.exports = ApiConnection;
