const express = require('express');
const { applyAjioTaxRules } = require('./lib/orderTaxService');

const PORT = process.env.PORT || 8080;

const app = express();

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/order/tax-update', (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Missing JSON payload' });
    }

    const { order, updatedProducts, skippedReason } = applyAjioTaxRules(req.body);

    res.json({
      order,
      meta: {
        updatedProducts,
        skippedReason: skippedReason || null,
        processedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`BaseLinker tax add-on listening on port ${PORT}`);
  });
}

module.exports = app;
