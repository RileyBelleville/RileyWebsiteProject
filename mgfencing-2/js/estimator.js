document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('estimator-form');
  const category = document.getElementById('category');
  const lengthInput = document.getElementById('length');
  const heightRange = document.getElementById('height');
  const heightValue = document.getElementById('height-value');
  const chainOptions = document.getElementById('chainlink-options');
  const vinylOptions = document.getElementById('vinyl-options');
  const hasGates = document.getElementById('has-gates');
  const gateSection = document.getElementById('gate-section');
  const gateCount = document.getElementById('gate-count');
  const gateWidth = document.getElementById('gate-width');
  const gateAuto = document.getElementById('gate-auto');
  const updateBtn = document.getElementById('update-btn');
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
    gateSection.classList.toggle('hidden', !hasGates.checked);
  }
  category.addEventListener('change', () => { toggleSections(); update(); });
  if (hasGates) {
    hasGates.addEventListener('change', () => { toggleSections(); update(); });
  }

  ['input', 'change'].forEach(evt => {
    heightRange.addEventListener(evt, update);
  });

  [lengthInput, hasGates, gateCount, gateWidth, gateAuto,
    document.getElementById('slats'), document.getElementById('vinyl-slats'),
    document.getElementById('chain-color'), document.getElementById('gate-type')
  ].forEach(el => {
    if (el) el.addEventListener('input', update);
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    update();
  });
  if (updateBtn) {
    updateBtn.addEventListener('click', update);
  }

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

    const product = category.value;
    const info = prices.products[product] || {};
    let materialRate = info.material || 0;
    const height = parseInt(heightRange.value, 10) || 4;
    const mult = height / 4;
    if (product === 'chainlink') {
      const color = document.getElementById('chain-color').value;
      if (color && color !== 'galvanized' && info.materialColored) {
        materialRate = info.materialColored;
      }
    }
    let materialCost = materialRate * mult * length;

    if (product === 'chainlink' && document.getElementById('slats').checked) {
      materialCost += 5 * mult * length;
    }
    if (product === 'vinyl' && document.getElementById('vinyl-slats').checked) {
      materialCost += 7 * mult * length;
    }

    if (hasGates && hasGates.checked) {
      const gates = parseInt(gateCount.value) || 0;
      const gateWidthVal = parseFloat(gateWidth.value) || 0;
      if (gates > 0) {
        const gateRate = info.gate || 0;
        materialCost += gates * gateWidthVal * height * gateRate;
        if (gateAuto.checked) {
          materialCost += gates * 1000;
        }
      }
    }

    const tax = materialCost * (prices.taxRate || 0);
    const total = materialCost + tax;

    summary.querySelector('[data-materials]').textContent = materialCost.toFixed(2);
    summary.querySelector('[data-total]').textContent = total.toFixed(2);
  }

  toggleSections();
  update();
});
