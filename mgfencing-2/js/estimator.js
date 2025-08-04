document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('estimator-form');
  const category = document.getElementById('category');
  const lengthInput = document.getElementById('length');
  const heightRange = document.getElementById('height');
  const heightValue = document.getElementById('height-value');
  const chainOptions = document.getElementById('chainlink-options');
  const vinylOptions = document.getElementById('vinyl-options');
  const gateSection = document.getElementById('gate-section');
  const gateCount = document.getElementById('gate-count');
  const gateWidth = document.getElementById('gate-width');
  const gateAuto = document.getElementById('gate-auto');
  const summary = document.getElementById('summary');
  const lengthError = document.getElementById('length-error');

  let prices = { taxRate: 0, products: {} };

  fetch('api/prices.json')
    .then(r => r.json())
    .then(data => { prices = data; update(); });

  function toggleSections() {
    const val = category.value;
    chainOptions.classList.toggle('hidden', val !== 'chainlink');
    vinylOptions.classList.toggle('hidden', val !== 'vinyl');
    gateSection.classList.toggle('hidden', !['privacy','vinyl','chainlink','wrought_iron'].includes(val));
  }
  category.addEventListener('change', () => { toggleSections(); update(); });

  heightRange.addEventListener('input', () => {
    heightValue.textContent = `${heightRange.value}ft`;
    update();
  });

  [lengthInput, gateCount, gateWidth, gateAuto, document.getElementById('slats'), document.getElementById('vinyl-slats'), document.getElementById('chain-color'), document.getElementById('gate-type')].forEach(el => {
    if (el) el.addEventListener('input', update);
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    update();
  });

  function update() {
    const length = parseFloat(lengthInput.value);
    if (!length || length < 10) {
      lengthError.textContent = 'Minimum perimeter is 10 ft';
      lengthError.classList.remove('hidden');
      lengthInput.setAttribute('aria-invalid', 'true');
      summary.querySelector('[data-materials]').textContent = '0.00';
      summary.querySelector('[data-total]').textContent = '0.00';
      summary.querySelector('[data-posts]').textContent = '0';
      summary.querySelector('[data-rails]').textContent = '0';
      return;
    }
    lengthError.classList.add('hidden');
    lengthInput.removeAttribute('aria-invalid');

    const product = category.value;
    const info = prices.products[product] || {};
    const materialRate = info.material || 0;
    const height = parseInt(heightRange.value, 10) || 4;
    const mult = {3:0.75,4:1,5:1.25,6:1.5}[height] || 1;
    let materialCost = materialRate * mult * length;

    if (product === 'chainlink' && document.getElementById('slats').checked) {
      materialCost += 5 * mult * length;
    }
    if (product === 'vinyl' && document.getElementById('vinyl-slats').checked) {
      materialCost += 7 * mult * length;
    }

    const gates = parseInt(gateCount.value) || 0;
    const gateWidthVal = parseFloat(gateWidth.value) || 0;
    if (gates > 0) {
      const gateRate = info.gate || 0;
      materialCost += gates * gateWidthVal * gateRate;
      if (gateAuto.checked) {
        materialCost += gates * 1000;
      }
    }

    const posts = Math.ceil(length / 8) + 1;
    const rails = posts * 2;
    const tax = materialCost * (prices.taxRate || 0);
    const total = materialCost + tax;

    summary.querySelector('[data-materials]').textContent = materialCost.toFixed(2);
    summary.querySelector('[data-total]').textContent = total.toFixed(2);
    summary.querySelector('[data-posts]').textContent = posts;
    summary.querySelector('[data-rails]').textContent = rails;
  }

  toggleSections();
  update();
});
