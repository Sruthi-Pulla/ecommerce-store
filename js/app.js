const STORAGE_KEY = 'northstar-market-wishlists';

let currentFilter = 'All';
let currentSearch = '';

// Shared helpers for reading, normalizing, and persisting wishlist state.
function getActiveWishlist(state = parseWishlists()) {
  return state.wishlists.find((entry) => entry.id === state.activeId) || state.wishlists[0] || null;
}

function setStatusMessage(message) {
  const status = document.getElementById('wishlistStatus');
  if (status) {
    status.textContent = message;
  }
}

function persistAndRender(state) {
  saveWishlists(state);
  renderWishlistControls(state);
}

function populateSelect(selectElement, options) {
  if (!selectElement) return;

  selectElement.innerHTML = '';
  options.forEach((option) => {
    const element = document.createElement('option');
    element.value = option.value;
    element.textContent = option.text;
    selectElement.appendChild(element);
  });
}

function getProductMeta(item) {
  return sampleProducts.find((product) => product.id === item.id) || {
    image: 'assets/placeholder.svg',
    title: item.name,
    price: item.price,
    category: item.category
  };
}

function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';

  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.textContent = 'Add to wishlist';
  addButton.setAttribute('aria-label', `Add ${product.title} to the active wishlist`);
  addButton.addEventListener('click', () => addProductToActiveWishlist(product));

  card.innerHTML = `
    <img src="${product.image}" alt="${product.title}" class="product-image" />
    <h3>${product.title}</h3>
    <div class="meta">${product.category}</div>
    <div class="price">$${product.price}</div>
    <div class="meta">${product.description}</div>
  `;
  card.appendChild(addButton);
  return card;
}

function createWishlistItemRow(item) {
  const row = document.createElement('div');
  row.className = 'wishlist-item';
  const productMeta = getProductMeta(item);
  row.innerHTML = `
    <div class="wishlist-item-main">
      <img src="${productMeta.image}" alt="${productMeta.title}" class="wishlist-item-image" />
      <div>
        <strong>${productMeta.title}</strong>
        <div class="meta">${productMeta.category}</div>
      </div>
    </div>
    <div class="wishlist-item-actions">
      <div class="price">$${productMeta.price}</div>
      <button type="button" class="remove-btn" aria-label="Remove ${productMeta.title} from the active wishlist">Remove</button>
    </div>
  `;
  const removeButton = row.querySelector('.remove-btn');
  removeButton.addEventListener('click', () => removeFromActiveWishlist(item.id));
  return row;
}

const sampleProducts = [
  { id: 'p1', title: 'Aurora Lamp', price: 79, image: 'assets/placeholder.svg', category: 'Home', description: 'A sculptural bedside lamp with a warm glow for modern interiors.' },
  { id: 'p2', title: 'Nimbus Backpack', price: 64, image: 'assets/placeholder.svg', category: 'Travel', description: 'Lightweight carry-all designed for daily commutes and weekend escapes.' },
  { id: 'p3', title: 'Echo Headphones', price: 129, image: 'assets/placeholder.svg', category: 'Audio', description: 'Immersive sound in a compact form with all-day comfort.' },
  { id: 'p4', title: 'Cinder Mug', price: 24, image: 'assets/placeholder.svg', category: 'Kitchen', description: 'Hand-finished ceramic mug with a matte exterior and cozy feel.' },
  { id: 'p5', title: 'Harbor Throw', price: 49, image: 'assets/placeholder.svg', category: 'Home', description: 'Soft woven throw made to layer into your reading corner.' },
  { id: 'p6', title: 'Summit Bottle', price: 35, image: 'assets/placeholder.svg', category: 'Travel', description: 'Insulated bottle that keeps beverages cold for hours.' },
  { id: 'p7', title: 'Pixel Watch', price: 199, image: 'assets/placeholder.svg', category: 'Tech', description: 'A refined smartwatch with wellness tracking and premium finishes.' },
  { id: 'p8', title: 'Lumen Desk', price: 149, image: 'assets/placeholder.svg', category: 'Home', description: 'Minimal desk lamp designed to brighten focused work sessions.' },
  { id: 'p9', title: 'Tidal Tote', price: 58, image: 'assets/placeholder.svg', category: 'Fashion', description: 'Spacious tote with a structured silhouette and everyday utility.' },
  { id: 'p10', title: 'Ridge Sneakers', price: 92, image: 'assets/placeholder.svg', category: 'Fashion', description: 'Comfort-first sneakers with a clean profile and lasting cushioning.' },
  { id: 'p11', title: 'Terra Plant Kit', price: 32, image: 'assets/placeholder.svg', category: 'Home', description: 'Starter kit for a compact indoor plant setup with ceramic accents.' },
  { id: 'p12', title: 'North Speaker', price: 109, image: 'assets/placeholder.svg', category: 'Audio', description: 'Portable speaker with rich bass and crystal-clear playback.' }
];

function parseWishlists() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || !raw.trim()) {
      return createDefaultState();
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return createDefaultState();
    }

    const wishlists = Array.isArray(parsed.wishlists)
      ? parsed.wishlists
          .filter((wishlist) => wishlist && typeof wishlist === 'object')
          .map((wishlist) => ({
            id: typeof wishlist.id === 'string' && wishlist.id.trim() ? wishlist.id : createId('wishlist'),
            name: typeof wishlist.name === 'string' && wishlist.name.trim() ? wishlist.name : 'Untitled wishlist',
            items: Array.isArray(wishlist.items)
              ? wishlist.items.filter((item) => item && typeof item === 'object')
              : []
          }))
      : [];

    if (wishlists.length === 0) {
      return createDefaultState();
    }

    const activeId = typeof parsed.activeId === 'string' && parsed.activeId.trim()
      ? parsed.activeId
      : wishlists[0]?.id || null;

    return { wishlists, activeId };
  } catch (error) {
    console.warn('Falling back to default wishlist state:', error);
    return createDefaultState();
  }
}

function createDefaultState() {
  const defaultList = { id: createId('wishlist'), name: 'My first wishlist', items: [] };
  return { wishlists: [defaultList], activeId: defaultList.id };
}

function saveWishlists(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Unable to save wishlist data:', error);
  }
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function getFilteredProducts() {
  return sampleProducts.filter((product) => {
    const matchesCategory = currentFilter === 'All' || product.category === currentFilter;
    const term = currentSearch.trim().toLowerCase();
    const matchesSearch = !term || `${product.title} ${product.description} ${product.category}`.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });
}

function showToast(message) {
  const layer = document.getElementById('toastLayer');
  if (!layer) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  layer.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

// Product rendering uses a small helper and a batched fragment for smoother UI updates.
function renderProducts() {
  const productGrid = document.getElementById('productGrid');
  if (!productGrid) return;

  productGrid.innerHTML = '<div class="loading-state">Loading products…</div>';

  const scheduleRender = typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame
    : (callback) => setTimeout(callback, 0);

  scheduleRender(() => {
    const filteredProducts = getFilteredProducts();
    productGrid.innerHTML = '';

    if (filteredProducts.length === 0) {
      productGrid.innerHTML = '<div class="empty-state"><p>No products match the current filter.</p><span>Try a different search term or category.</span></div>';
      return;
    }

    const fragment = typeof document.createDocumentFragment === 'function' ? document.createDocumentFragment() : null;
    filteredProducts.forEach((product) => {
      const card = createProductCard(product);
      if (fragment) {
        fragment.appendChild(card);
      } else {
        productGrid.appendChild(card);
      }
    });

    if (fragment) {
      productGrid.appendChild(fragment);
    }
  });
}

function renderWishlistStats(state) {
  const stats = document.getElementById('wishlistStats');
  if (!stats) return;

  const activeList = getActiveWishlist(state);
  stats.innerHTML = `
    <div class="stat-card">
      <span class="meta">Products</span>
      <strong>${sampleProducts.length}</strong>
    </div>
    <div class="stat-card">
      <span class="meta">Wishlists</span>
      <strong>${state.wishlists.length}</strong>
    </div>
    <div class="stat-card">
      <span class="meta">Active items</span>
      <strong>${activeList?.items?.length || 0}</strong>
    </div>
  `;
}

// Wishlist item rendering is split into its own helper so it can be reused and kept easy to read.
function renderActiveWishlistItems(activeList) {
  const activeWishlist = document.getElementById('activeWishlist');
  if (!activeWishlist) return;

  activeWishlist.innerHTML = '';
  if (!activeList) {
    activeWishlist.innerHTML = '<p>No wishlists yet.</p>';
    return;
  }

  if (activeList.items.length === 0) {
    activeWishlist.innerHTML = '<div class="empty-state"><p>Your active wishlist is empty.</p><span>Add products from the catalog to fill it up.</span></div>';
    return;
  }

  const fragment = typeof document.createDocumentFragment === 'function' ? document.createDocumentFragment() : null;
  activeList.items.forEach((item) => {
    const row = createWishlistItemRow(item);
    if (fragment) {
      fragment.appendChild(row);
    } else {
      activeWishlist.appendChild(row);
    }
  });

  if (fragment) {
    activeWishlist.appendChild(fragment);
  }
}

function renderWishlistControls(state) {
  const select = document.getElementById('wishlistSelect');
  const sourceSelect = document.getElementById('sourceWishlistSelect');
  const targetSelect = document.getElementById('targetWishlistSelect');
  const activeWishlist = document.getElementById('activeWishlist');
  const status = document.getElementById('wishlistStatus');

  const options = state.wishlists.map((wishlist) => ({ value: wishlist.id, text: wishlist.name }));
  populateSelect(select, options);
  populateSelect(sourceSelect, options);
  populateSelect(targetSelect, options);

  if (select) {
    select.value = state.activeId;
  }
  if (sourceSelect && options.length > 0) {
    sourceSelect.value = options[0].value;
  }
  if (targetSelect) {
    targetSelect.value = state.activeId;
  }

  renderWishlistStats(state);

  const activeList = getActiveWishlist(state);
  renderActiveWishlistItems(activeList);

  if (!activeList) {
    if (activeWishlist) {
      activeWishlist.innerHTML = '<p>No wishlists yet.</p>';
    }
    setStatusMessage('Create a wishlist to start.');
    return;
  }

  if (status) {
    status.textContent = `${activeList.name} contains ${activeList.items.length} item(s).`;
  }
  setStatusMessage(`${activeList.name} contains ${activeList.items.length} item(s).`);
}

function addProductToActiveWishlist(product) {
  const state = parseWishlists();
  const activeList = getActiveWishlist(state);
  if (!activeList) return;

  const exists = activeList.items.some((entry) => entry.id === product.id);
  if (exists) {
    setStatusMessage(`${product.title} is already in ${activeList.name}.`);
    return;
  }

  activeList.items.push({ id: product.id, name: product.title, price: product.price, category: product.category });
  persistAndRender(state);
  setStatusMessage(`${product.title} added to ${activeList.name}.`);
  showToast(`${product.title} added to ${activeList.name}`);
}

function removeFromActiveWishlist(productId) {
  const state = parseWishlists();
  const activeList = getActiveWishlist(state);
  if (!activeList) return;

  activeList.items = activeList.items.filter((item) => item.id !== productId);
  persistAndRender(state);
  showToast('Item removed from wishlist');
}

function createWishlist() {
  const input = document.getElementById('wishlistNameInput');
  const name = input?.value.trim() || '';
  if (!name) {
    setStatusMessage('Please enter a wishlist name.');
    showToast('Wishlist name cannot be empty');
    return;
  }

  const state = parseWishlists();
  const duplicate = state.wishlists.some((wishlist) => wishlist.name.trim().toLowerCase() === name.toLowerCase());
  if (duplicate) {
    setStatusMessage('A wishlist with that name already exists.');
    showToast('Duplicate wishlist name');
    return;
  }

  const newList = { id: createId('wishlist'), name, items: [] };
  state.wishlists.push(newList);
  state.activeId = newList.id;
  persistAndRender(state);
  if (input) {
    input.value = '';
  }
  setStatusMessage(`Created ${name}.`);
  showToast(`Created ${name}`);
}

function renameWishlist() {
  const state = parseWishlists();
  const activeList = getActiveWishlist(state);
  if (!activeList) return;

  const newName = prompt('Rename wishlist', activeList.name);
  if (newName === null) return;

  const trimmedName = newName.trim();
  if (!trimmedName) {
    setStatusMessage('Wishlist names cannot be empty.');
    showToast('Wishlist name cannot be empty');
    return;
  }

  const duplicate = state.wishlists.some((wishlist) => wishlist.id !== activeList.id && wishlist.name.trim().toLowerCase() === trimmedName.toLowerCase());
  if (duplicate) {
    setStatusMessage('A wishlist with that name already exists.');
    showToast('Duplicate wishlist name');
    return;
  }

  activeList.name = trimmedName;
  persistAndRender(state);
  showToast(`Renamed wishlist to ${activeList.name}`);
}

function deleteWishlist() {
  const state = parseWishlists();
  const activeList = getActiveWishlist(state);
  if (!activeList) return;

  if (!confirm(`Delete ${activeList.name}?`)) return;

  state.wishlists = state.wishlists.filter((entry) => entry.id !== state.activeId);
  if (state.wishlists.length === 0) {
    const fallback = createDefaultState();
    state.wishlists = fallback.wishlists;
    state.activeId = fallback.activeId;
  } else {
    state.activeId = state.wishlists[0]?.id || null;
  }
  persistAndRender(state);
  showToast('Wishlist deleted');
}

function mergeWishlists() {
  const sourceSelect = document.getElementById('sourceWishlistSelect');
  const targetSelect = document.getElementById('targetWishlistSelect');
  const sourceId = sourceSelect?.value || '';
  const targetId = targetSelect?.value || '';
  if (!sourceId || !targetId) {
    setStatusMessage('Choose two wishlists before merging.');
    showToast('Select two wishlists to merge');
    return;
  }

  if (sourceId === targetId) {
    setStatusMessage('Choose two different wishlists to merge.');
    showToast('Merge requires two different lists');
    return;
  }

  const state = parseWishlists();
  const firstList = state.wishlists.find((entry) => entry.id === sourceId);
  const secondList = state.wishlists.find((entry) => entry.id === targetId);
  if (!firstList || !secondList) return;

  const newName = prompt('Name the merged wishlist', `${firstList.name} + ${secondList.name}`);
  if (!newName || !newName.trim()) {
    setStatusMessage('Merge cancelled.');
    return;
  }

  const mergedItems = [];
  const seenIds = new Set();

  [firstList, secondList].forEach((wishlist) => {
    wishlist.items.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      if (seenIds.has(item.id)) return;
      seenIds.add(item.id);
      mergedItems.push({ ...item });
    });
  });

  if (mergedItems.length === 0) {
    setStatusMessage('Both selected wishlists are empty, so there is nothing to merge.');
    showToast('Nothing to merge');
    return;
  }

  const mergedWishlist = {
    id: createId('wishlist'),
    name: newName.trim(),
    items: mergedItems
  };

  state.wishlists.push(mergedWishlist);
  state.activeId = mergedWishlist.id;
  persistAndRender(state);
  setStatusMessage(`Created ${mergedWishlist.name} with ${mergedItems.length} unique item(s).`);
  showToast(`Merged favorites into ${mergedWishlist.name}`);
}

function attachEvents() {
  document.getElementById('createWishlistBtn').addEventListener('click', createWishlist);
  document.getElementById('renameWishlistBtn').addEventListener('click', renameWishlist);
  document.getElementById('deleteWishlistBtn').addEventListener('click', deleteWishlist);
  document.getElementById('mergeWishlistBtn').addEventListener('click', mergeWishlists);
  document.getElementById('wishlistSelect').addEventListener('change', (event) => {
    const state = parseWishlists();
    state.activeId = event.target.value;
    saveWishlists(state);
    renderWishlistControls(state);
  });

  document.getElementById('searchInput').addEventListener('input', (event) => {
    currentSearch = event.target.value;
    renderProducts();
  });

  const filterButtons = Array.from(document.querySelectorAll('.filter-chip'));
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      currentFilter = button.dataset.category;
      filterButtons.forEach((chip) => {
        const isActive = chip === button;
        chip.classList.toggle('active', isActive);
        chip.setAttribute('aria-pressed', String(isActive));
      });
      renderProducts();
    });
  });
}

function bootstrap() {
  renderProducts();
  const state = parseWishlists();
  saveWishlists(state);
  renderWishlistControls(state);
  attachEvents();
}

if (typeof document !== 'undefined') {
  bootstrap();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STORAGE_KEY,
    sampleProducts,
    parseWishlists,
    createDefaultState,
    saveWishlists,
    createId,
    getFilteredProducts,
    showToast,
    renderProducts,
    renderWishlistControls,
    addProductToActiveWishlist,
    removeFromActiveWishlist,
    createWishlist,
    renameWishlist,
    deleteWishlist,
    mergeWishlists,
    attachEvents,
    bootstrap
  };
}
