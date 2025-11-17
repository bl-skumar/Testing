# BaseLinker Ajio Tax Update Add-on

This add-on exposes a lightweight HTTP endpoint that BaseLinker can call (via the Add-ons platform or Automation > Webhooks) to enforce the Ajio-specific tax rules:

- Products priced **≤ 2500** are forced to **5%** tax.
- Products priced **> 2500** are forced to **18%** tax.

The logic applies only to orders whose `source` (or `order_source`) equals `ajio` (case-insensitive). Every matching product gets an updated `tax_rate` along with recomputed `price_netto` based on the incoming `price_brutto`.

## Project layout

```
src/
  server.js               # Express entry point
  lib/orderTaxService.js  # Ajio-specific order mapping
  lib/taxRules.js         # Tax thresholds & helpers
```

## Getting started

```bash
npm install
npm run dev   # starts on http://localhost:8080 with nodemon
```

Set a different port with `PORT=4000 npm start` if needed.

## BaseLinker configuration

1. Deploy this service somewhere reachable from BaseLinker (e.g., Render, Railway, AWS Lambda + API Gateway, etc.).
2. In BaseLinker, open **Add-ons (Beta)** → **Custom add-on** or configure an **Automation > Webhook** that triggers for order events.
3. Point the webhook/add-on action to `POST https://<your-domain>/order/tax-update`.
4. Send the order payload in BaseLinker’s standard JSON format. The response mirrors the order with updated products and should be fed back into the workflow (BaseLinker accepts the mutated order body from the add-on response).

### Expected payload shape

```json
{
  "order": {
    "source": "ajio",
    "products": [
      {
        "name": "T-shirt",
        "sku": "TSHIRT-1",
        "price_brutto": 1999,
        "tax_rate": 0
      }
    ]
  }
}
```

### Sample response

```json
{
  "order": {
    "source": "ajio",
    "products": [
      {
        "name": "T-shirt",
        "sku": "TSHIRT-1",
        "price_brutto": 1999,
        "price_netto": 1903.81,
        "tax_rate": 5
      }
    ]
  },
  "meta": {
    "updatedProducts": 1,
    "skippedReason": null,
    "processedAt": "2025-11-17T10:00:00.000Z"
  }
}
```

### Curl example

```bash
curl -X POST http://localhost:8080/order/tax-update \
  -H 'Content-Type: application/json' \
  -d '{
    "order": {
      "source": "ajio",
      "products": [
        { "sku": "SKU-1", "price_brutto": 2400 },
        { "sku": "SKU-2", "price_brutto": 3500 }
      ]
    }
  }'
```

## Notes & extensions

- Orders from other sources pass through untouched (metadata will include `skippedReason`).
- Products missing price information are ignored individually without failing the whole payload.
- Extend `DEFAULT_TAX_RULES` in `src/lib/taxRules.js` if Ajio changes their brackets.
- Wrap the endpoint with authentication (API key, HMAC) before going to production.
