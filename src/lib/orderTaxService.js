const { resolveTaxRate, parsePrice, currencyRound } = require('./taxRules');

const AJIO_SOURCE = 'ajio';

const getOrderSource = (order = {}) => {
  const source = order.source || order.order_source || order.sales_channel;
  return typeof source === 'string' ? source.trim().toLowerCase() : '';
};

const isAjioOrder = (order) => getOrderSource(order) === AJIO_SOURCE;

function enrichProductWithTax(product) {
  const price =
    parsePrice(product?.price_brutto) ??
    parsePrice(product?.price) ??
    parsePrice(product?.price_netto && product?.tax_rate
      ? Number(product.price_netto) * (1 + Number(product.tax_rate) / 100)
      : null);

  if (price === null) {
    return { product, changed: false, reason: 'missing_price' };
  }

  const taxRate = resolveTaxRate(price);
  const priceNetto = currencyRound(price / (1 + taxRate / 100));

  const shouldUpdate = Number(product.tax_rate) !== taxRate ||
    Number(product.price_netto) !== priceNetto;

  if (!shouldUpdate) {
    return { product, changed: false };
  }

  const updatedProduct = {
    ...product,
    price_brutto: currencyRound(price),
    price_netto: priceNetto,
    tax_rate: taxRate
  };

  return { product: updatedProduct, changed: true };
}

function applyAjioTaxRules(payload = {}) {
  const order = payload.order ?? payload;

  if (!order || typeof order !== 'object') {
    throw new Error('Order payload must be an object');
  }

  if (!isAjioOrder(order)) {
    return { order, updatedProducts: 0, skippedReason: 'non_ajio_source' };
  }

  const products = Array.isArray(order.products) ? order.products : [];
  let updatedProducts = 0;

  const newProducts = products.map((product) => {
    const { product: updatedProduct, changed } = enrichProductWithTax(product);
    if (changed) {
      updatedProducts += 1;
    }
    return updatedProduct;
  });

  const updatedOrder = {
    ...order,
    products: newProducts
  };

  return {
    order: updatedOrder,
    updatedProducts
  };
}

module.exports = {
  applyAjioTaxRules,
  enrichProductWithTax,
  isAjioOrder
};
