import { estimate } from './estimate-core.js';

const DEFAULT_FEED = {
  version: '2025.08.15',
  region: 'ON',
  products: [
    {
      id: 'chain-link',
      label: 'Chain-Link Fence',
      heights: [4, 5, 6, 8],
      colours: ['Galvanized', 'Black', 'Green'],
      basePerFt: { '4': 28, '5': 31, '6': 34, '8': 49 },
      postSpacingFt: 8,
      addons: [
        { id: 'privacy-slats', label: 'Privacy Slats', pricePerFt: 12 },
        { id: 'top-rail-upgrade', label: 'Top Rail Upgrade', pricePerFt: 3 }
      ],
      gateCatalog: [
        { id: 'single-36-swing', label: 'Single 36" Swing', widthIn: 36, type: 'swing', price: 325 },
        { id: 'double-144-swing', label: "Double 12' Driveway", widthIn: 144, type: 'swing', price: 790 }
      ]
    }
  ],
  taxes: [{ type: 'HST', rate: 0.13 }],
  labour: [{ id: 'base-per-ft', rate: 12 }],
  surcharges: [{ id: 'sloped-terrain', mul: 1.08 }],
  discounts: [{ id: 'volume-200ft', thresholdFt: 200, mul: 0.97 }]
};

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('estimator-form');
  const category = document.getElementById('category');
  const lengthInput = document.getElementById('length');
  const heightRange = document.getElementById('height');
  const heightValue = document.getElementById('height-value');
  const chainOptions = document.getElementById('chainlink-options');
  const vinylOptions = document.getElementById('vinyl-options');
  const lengthError = document.getElementById('length-error');
  const summary = document.getElementById('summary');
  const pdfBtn = document.getElementById('pdf-btn');

  let priceFeed = null;

  async function loadFeed() {
    try {
      // Prefer module-relative URL so this works from any route/build setup
      const res = await fetch(new URL('../api/prices.json', import.meta.url));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      priceFeed = await res.json();
    } catch (err) {
      console.warn('Price feed load failed, using defaults', err);
      priceFeed = DEFAULT_FEED;
    }
    update();
  }

  function toggleSections() {
    const val = category.value;
    chainOptions.classList.toggle('hidden', val !== 'chainlink');
    vinylOptions.classList.toggle('hidden', val !== 'vinyl');
  }

  category.addEventListener('change', () => { toggleSections(); update(); });
  [lengthInput, heightRange, document.getElementById('slats'), document.getElementById('vinyl-slats')]
    .forEach(el => { if (el) el.addEventListener('input', update); });

  if (form) {
    form.addEventListener('submit', e => { e.preventDefault(); update(); });
  }
  const updateBtn = document.getElementById('update-btn');
  if (updateBtn) updateBtn.addEventListener('click', update);

  if (pdfBtn) {
    pdfBtn.addEventListener('click', async () => {
      if (!priceFeed || !summary) return;
      try {
        const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Fence Estimate', 10, 20);

        const materialsEl = summary.querySelector('[data-materials]');
        const totalEl = summary.querySelector('[data-total]');
        const materials = materialsEl ? materialsEl.textContent : '0.00';
        const total = totalEl ? totalEl.textContent : '0.00';

        doc.setFontSize(12);
        doc.text(`Materials: $${materials}`, 10, 40);
        doc.text(`Total: $${total}`, 10, 50);
        doc.save('estimate.pdf');
      } catch (e) {
        console.error('PDF generation failed', e);
      }
    });
  }

  function update() {
    if (heightValue && heightRange) {
      heightValue.textContent = `${heightRange.value}ft`;
    }

    const length = parseFloat(lengthInput.value);
    if (!length || length < 10) {
      lengthError.textContent = 'Minimum perimeter is 10 ft';
      lengthError.classList.remove('hidden');
      lengthInput.setAttribute('aria-invalid', 'true');
      const mEl = summary.querySelector('[data-materials]');
      const tEl = summary.querySelector('[data-total]');
      if (mEl) mEl.textContent = '0.00';
      if (tEl) tEl.textContent = '0.00';
      return;
    }

    lengthError.classList.add('hidden');
    lengthInput.removeAttribute('aria-invalid');
    if (!priceFeed) return;

    const productIdMap = { chainlink: 'chain-link' };
    const productId = productIdMap[category.value] || category.value;

    const addons = [];
    const slatsEl = document.getElementById('slats');
    if (category.value === 'chainlink' && slatsEl && slatsEl.checked) {
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
      const materials = (result.items.base || 0) + (result.items.gates || 0) + (result.items.addons || 0);
      const mEl = summary.querySelector('[data-materials]');
      const tEl = summary.querySelector('[data-total]');
      if (mEl) mEl.textContent = materials.toFixed(2);
      if (tEl) tEl.textContent = result.total.toFixed(2);
    } catch (err) {
      console.error('Estimation failed', err);
    }
  }

  toggleSections();
  update();
  loadFeed();
});
