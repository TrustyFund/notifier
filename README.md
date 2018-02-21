# Bitshares email notifier
## Using our service

This service listens bitshares blockchain for subscriptions & events and sends subscribers info about:
- Transfer received
- Order filled

To subscribe you need to send 50 BTS to email-notifier user with memo:
- To subscribe: 
``
your@email.org 
``
- To unsubscribe: 
``
stop your@email.org
``

## To run your own node:
``
cp config.sample.js config.js
``

Then add your credentials including service account brainkey and email options.

You can also set System asset and Price for subscription (default is bts and 0)

Then typicaly start:
``
npm install && npm start
``
