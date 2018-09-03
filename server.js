const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const payjp = require('payjp')(process.env.PAYJP_PRIVATE_KEY);
const qs = require('querystring');
const crypto = require('crypto');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json({limit:'10mb'}));
app.use(bodyParser.urlencoded({limit:'10mb', extended: false}));
app.use(express.static('public'));

const memoryDB = {};
app.post("/", function (req, res) {
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
  } = req.body;
  memoryDB[x_signature] = {
    x_account_id: x_account_id || '',
    x_amount: x_amount || 0,
    x_currency: x_currency,
    x_reference,
    x_test,
  };
  res.render('index', {
    amount: x_amount || 0,
    x_signature,
    shopName: x_shop_name,
    urlComplete: x_url_complete,
    urlCancel: x_url_cancel,
    dataKey: process.env.PAYJP_PUBLIC_KEY,
    dataPayjp: process.env.PAYJP_OAUTH_CLIENT_ID,
  });
});

app.post('/charges', async (req, res) => {
  const hmac = crypto.createHmac('sha256', process.env.SHOPIFY_HMAC_KEY);
  const {
    x_account_id,
    x_amount,
    x_currency,
    x_reference,
    x_test,
  } = memoryDB[req.body.x_signature];
  let payjpResponse;
  try {
    payjpResponse = await payjp.charges.create({
      card: req.body.card,
      amount: x_amount,
      currency: x_currency.toLowerCase(),
      // metadata: data.metadata
    });
  } catch (e) {
    console.error(e);
    res.json({});
  }
  const params = {
    x_account_id,
    x_amount,
    x_currency,
    x_gateway_reference: `${payjpResponse.created}`, // Unique reference for each response issued by the payment processor.
    x_reference,
    x_result: 'completed',
    x_test,
    x_timestamp: (new Date(payjpResponse.created * 1000)).toISOString().slice(0,-5) + 'Z',
  };
  hmac.update(
    `x_account_id${x_account_id}x_amount${x_amount}x_currency${x_currency}` +
    `x_gateway_reference${params.x_gateway_reference}x_reference${x_reference}` +
    `x_result${params.x_result}x_test${x_test}x_timestamp${params.x_timestamp}`
  );
  params.x_signature = hmac.digest('hex');
  console.log(params);
  res.send(qs.stringify(params));
});

const server = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + server.address().port);
});