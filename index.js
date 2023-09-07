'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

require('dotenv').config();
const apiRouter = require('./routes/api');
const Utils = require('./controllers/Utils');


// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();
// app.use(express.json());
// app.use(express.urlencoded({extended: false}));
// app.use(cookieParser());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: true}));
app.use('/api', apiRouter);


// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  console.log('callback-req.body:',req.body);
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});



// event handler
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  // create a echoing text message
  const echo = { type: 'text', text: event.message.text };
  console.log('handleEvent-event:',event)
  let res = await Utils.callAPI('https://line-chatbot-hwkc.onrender.com/sendMessage', 'POST', { text: event.message.text });
  console.log('handleEvent-res:',res)
  let result = { type: 'text', text: res };
  console.log('handleEvent-result:',result)

  // use reply API
  return client.replyMessage(event.replyToken,result);
}



// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});