Need the following `.env` file on this repository root.

```
PAYJP_PUBLIC_KEY='pk_test_xxx'
PAYJP_PRIVATE_KEY='sk_test_xxx'
PAYJP_OAUTH_CLIENT_ID='for_payid'
SHOPIFY_HMAC_KEY='iU44RWxeik' # https://help.shopify.com/en/api/guides/payment-gateway/hosted-payment-sdk/develop-gateway
```

### memo

```
// 422 Unprocessable Entity

// Notification acknowledgment failed
// https://offsite-gateway-sim.shopifycloud.com/calculator
throw new Error('invalid x_signature');

// Unable to find checkout with id <x>
throw new Error('invalid x_reference');

// pending -> paid process
// in x_url_callback
let x_result ='pending'; // pending
x_result ='completed'; // paid
```