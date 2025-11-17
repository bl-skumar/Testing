const DEFAULT_TAX_RULES = [
  { threshold: 2500, rate: 5 },
  { threshold: Infinity, rate: 18 }
];

const currencyRound = (value) => Number(value.toFixed(2));

function parsePrice(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0) {
    return numeric;
  }
  return null;
}

function resolveTaxRate(price, rules = DEFAULT_TAX_RULES) {
  if (!Number.isFinite(price) || price < 0) {
    throw new Error('Price must be a non-negative number');
  }

  const matchingRule = rules.find((rule) => price <= rule.threshold);
  return matchingRule ? matchingRule.rate : rules[rules.length - 1].rate;
}

module.exports = {
  DEFAULT_TAX_RULES,
  resolveTaxRate,
  parsePrice,
  currencyRound
};
