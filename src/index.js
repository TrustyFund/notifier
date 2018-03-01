const { Apis } = require('bitsharesjs-ws');
const config = require('../config');
const cluster = require('cluster');
const processWork = require('./worker');

const updateConnectionStatus = (status) => {
  if (status === 'error' || status === 'closed') {
    process.exit(1);
  }
};


if (cluster.isMaster) {
  cluster.fork();
  cluster.on('exit', (worker) => {
    console.log('Worker ' + worker.id + ' died..');
    cluster.fork();
  });
} else {
  const needleIndex = cluster.worker.id % config.bitsharesNodes.length;
  const url = config.bitsharesNodes[needleIndex];
  Apis.setRpcConnectionStatusCallback(updateConnectionStatus);
  Apis.instance(url, true).init_promise.then(() => {
    processWork();
  }).catch(() => {
    updateConnectionStatus('error');
  });
}
