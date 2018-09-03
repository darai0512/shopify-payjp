const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const payjp = require('payjp')(process.env.PAYJP_PRIVATE_KEY);
const qs = require('querystring');
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', process.env.SHOPIFY_HMAC_KEY);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json({limit:'10mb'}));
app.use(bodyParser.urlencoded({limit:'10mb', extended: false}));
app.use(express.static('public'));

const memoryDB = {};
app.get("/", function (req, res) {
  console.log(req);
  const {
    x_account_id,
    x_amount,
    x_currency,
    x_reference,
    x_shop_name,
    x_test,
    x_signature,
    // x_url_callback,
    x_url_cancel,
    x_url_complete,
    x_customer_first_name,
    x_customer_last_name
  } = req.body;
  memoryDB[x_signature] = {
    accountId: x_account_id,
    amount: x_amount,
    currency: x_currency.toLowerCase(),
    x_reference,
    x_test,
  };
  res.render('index', {
    name: `${x_customer_first_name} ${x_customer_last_name}`,
    amount: x_amount,
    shopName: x_shop_name,
    urlComplete: x_url_complete,
    urlCancel: x_url_cancel,
    dataKey: process.env.PAYJP_PUBLIC_KEY,
    dataPayjp: process.env.PAYJP_OAUTH_CLIENT_ID,
  });
});

app.get('/charges', async (req, res) => {
  const data = memoryDB[req.query.x_signature];
  const payjpResponse = await payjp.charges.create({
    card: data.card,
    amount: data.amount,
    currency: data.currency.toLowerCase(),
    // metadata: data.metadata
  });
  console.log(payjpResponse);
  const params = qs.stringify({
    x_account_id,
    x_amount,
    x_currency,
    x_gateway_reference: '',
    x_reference,
    x_result: 'complete',
    x_test,
    x_timestamp: payjpResponse.timestamp, // todo
    x_transaction_type: 'sale',
  });
  hmac.update(JSON.stringify(params));
  params.x_signature = hmac.digest('hex');
  res.json(params);
  res.sendStatus(200); // todo return params
});

const server = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + server.address().port);
});