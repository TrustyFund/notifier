const { Apis } = require('bitsharesjs-ws');
const config = require('../config');
const cluster = require('cluster');
const NodesManager = require('./NodesManager');
const processWork = require('./worker');

const nodesManager = new NodesManager({
  nodes: config.bitsharesNodes.list,
  defaultNode: config.bitsharesNodes.defaultNode
});

const updateConnectionStatus = (status) => {
  if (status === 'error' || status === 'closed') {
    process.exit(1);
  }
};
let retryCount = 0;

if (cluster.isMaster) {
  cluster.fork();
  cluster.on('exit', (worker) => {
    console.log('Worker ' + worker.id + ' died..');
    retryCount += 1;
    cluster.fork();
  });
} else {
  const url = retryCount ? nodesManager.getAnotherNodeUrl() : nodesManager.getInitialNodeUrl();
  Apis.setRpcConnectionStatusCallback(updateConnectionStatus);
  Apis.instance(url, true).init_promise.then(() => {
    nodesManager.testNodesPings();
    processWork();
  }).catch(() => {
    updateConnectionStatus('error');
  });
}
