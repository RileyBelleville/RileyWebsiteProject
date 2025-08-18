/**
 * Pure estimation logic with no DOM dependencies.
 * @param {object} input - user selections
 * @param {string} input.productId
 * @param {number} input.height
 * @param {number} input.footage
 * @param {string[]} [input.gates]
 * @param {string[]} [input.addons]
 * @param {string} [input.terrain]
 * @param {string} [input.region]
 * @param {object} priceFeed - pricing data
 */
export function estimate(input, priceFeed) {
  const product = priceFeed.products.find(p => p.id === input.productId);
  if (!product) {
    throw new Error('Unknown product');
  }
  if (input.footage < 10) {
    throw new Error('Footage must be at least 10ft');
  }
  if (!product.heights.includes(input.height)) {
    throw new Error('Invalid height');
  }

  const posts = Math.ceil(input.footage / product.postSpacingFt) + 1;
  const base = input.footage * product.basePerFt[String(input.height)];

  const gates = (input.gates || []).reduce((sum, gateId) => {
    const gate = product.gateCatalog.find(g => g.id === gateId);
    return gate ? sum + gate.price : sum;
  }, 0);

  const addons = (input.addons || []).reduce((sum, addonId) => {
    const addon = product.addons.find(a => a.id === addonId);
    if (!addon) return sum;
    if (addon.pricePerFt) return sum + addon.pricePerFt * input.footage;
    if (addon.priceFlat) return sum + addon.priceFlat;
    return sum;
  }, 0);

  const labourRate = priceFeed.labour.find(l => l.id === 'base-per-ft')?.rate || 0;
  const labour = input.footage * labourRate + (input.gates || []).length * 45;

  let subtotal = base + gates + addons + labour;

  if (input.footage >= 200) {
    const disc = priceFeed.discounts.find(d => d.id === 'volume-200ft');
    if (disc?.mul) subtotal *= disc.mul;
  }
  if (input.terrain === 'sloped') {
    const sur = priceFeed.surcharges.find(s => s.id === 'sloped-terrain');
    if (sur?.mul) subtotal *= sur.mul;
  }

  const taxRate = priceFeed.taxes.find(t => t.type === 'HST')?.rate || 0;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return {
    posts,
    items: { base, gates, addons, labour },
    subtotal,
    tax,
    total
  };
}
