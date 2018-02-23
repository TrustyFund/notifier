# BitShares email notifications service
## Using the service

This service monitors the Bitshares blockchain and notifies subscribers regarding the following activity types:
- Transfer
- Fill order

To get a lifetime subscription, send at least 50 BTS to account name "EMAIL-NOTIFIER" with tx memo:
- To subscribe: 
``
your@email.org 
``
- To unsubscribe: 
``
stop your@email.org
``

## Running the service on your own node 
``
cp config.sample.js config.js
``

Then add your credentials including service account brainkey and email options.

You can also set System asset and Price for subscription (default is bts and 0)

Then typicaly start:
``
npm install && npm start
``
