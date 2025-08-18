import { estimate } from './estimate-core.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('estimator-form');
  const category = document.getElementById('category');
  const lengthInput = document.getElementById('length');
  const heightRange = document.getElementById('height');
  const heightValue = document.getElementById('height-value');
  const chainOptions = document.getElementById('chainlink-options');
  const vinylOptions = document.getElementById('vinyl-options');
  const lengthError = document.getElementById('length-error');
  const summary = document.getElementById('summary');

  let priceFeed = null;

  fetch('api/prices.json')
    .then(r => r.json())
    .then(data => { priceFeed = data; update(); });

  function toggleSections() {
    const val = category.value;
    chainOptions.classList.toggle('hidden', val !== 'chainlink');
    vinylOptions.classList.toggle('hidden', val !== 'vinyl');
  }

  category.addEventListener('change', () => { toggleSections(); update(); });
  [lengthInput, heightRange, document.getElementById('slats'), document.getElementById('vinyl-slats')]
    .forEach(el => { if (el) el.addEventListener('input', update); });

  form.addEventListener('submit', e => { e.preventDefault(); update(); });
  document.getElementById('update-btn').addEventListener('click', update);

  function update() {
    heightValue.textContent = `${heightRange.value}ft`;
    const length = parseFloat(lengthInput.value);
    if (!length || length < 10) {
      lengthError.textContent = 'Minimum perimeter is 10 ft';
      lengthError.classList.remove('hidden');
      lengthInput.setAttribute('aria-invalid', 'true');
      summary.querySelector('[data-materials]').textContent = '0.00';
      summary.querySelector('[data-total]').textContent = '0.00';
      return;
    }
    lengthError.classList.add('hidden');
    lengthInput.removeAttribute('aria-invalid');
    if (!priceFeed) return;

    const productIdMap = { chainlink: 'chain-link' };
    const productId = productIdMap[category.value] || category.value;

    const addons = [];
    if (category.value === 'chainlink' && document.getElementById('slats').checked) {
      addons.push('privacy-slats');
    }
    const input = {
      productId,
      region: priceFeed.region,
      height: parseInt(heightRange.value, 10),
      footage: length,
      gates: [],
      addons,
      terrain: 'flat'
    };

    try {
      const result = estimate(input, priceFeed);
      const materials = result.items.base + result.items.gates + result.items.addons;
      summary.querySelector('[data-materials]').textContent = materials.toFixed(2);
      summary.querySelector('[data-total]').textContent = result.total.toFixed(2);
    } catch (err) {
      console.error(err);
    }
  }

  toggleSections();
  update();
});
