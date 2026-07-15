const STORAGE_KEY = 'northstar-market-wishlists';

const sampleProducts = [
  { id: 'p1', name: 'Aurora Lamp', price: 79, category: 'Home', stock: 12 },
  { id: 'p2', name: 'Nimbus Backpack', price: 64, category: 'Travel', stock: 8 },
  { id: 'p3', name: 'Echo Headphones', price: 129, category: 'Audio', stock: 6 },
  { id: 'p4', name: 'Cinder Mug', price: 24, category: 'Kitchen', stock: 20 }
];

function parseWishlists() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const defaultList = { id: createId('wishlist'), name: 'My first wishlist', items: [] };
    return { wishlists: [defaultList], activeId: defaultList.id };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.wishlists)) return createDefaultState();
    return {
      wishlists: parsed.wishlists.map((wishlist) => ({
        id: wishlist.id || createId('wishlist'),
        name: wishlist.name || 'Untitled wishlist',
        items: Array.isArray(wishlist.items) ? wishlist.items : []
      })),
      activeId: parsed.activeId || parsed.wishlists[0]?.id || null
    };
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function renderProducts() {
  const productGrid = document.getElementById('productGrid');
  productGrid.innerHTML = '';

  sampleProducts.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'product-card';

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = 'Add to wishlist';
    addButton.addEventListener('click', () => addProductToActiveWishlist(product));

    card.innerHTML = `
      <h3>${product.name}</h3>
      <div class="meta">${product.category}</div>
      <div class="price">$${product.price}</div>
      <div class="meta">${product.stock} in stock</div>
    `;
    card.appendChild(addButton);
    productGrid.appendChild(card);
  });
}

function renderWishlistControls(state) {
  const select = document.getElementById('wishlistSelect');
  const sourceSelect = document.getElementById('sourceWishlistSelect');
  const targetSelect = document.getElementById('targetWishlistSelect');
  const activeWishlist = document.getElementById('activeWishlist');
  const status = document.getElementById('wishlistStatus');

  select.innerHTML = '';
  sourceSelect.innerHTML = '';
  targetSelect.innerHTML = '';

  state.wishlists.forEach((wishlist) => {
    const option = document.createElement('option');
    option.value = wishlist.id;
    option.textContent = wishlist.name;
    select.appendChild(option.cloneNode(true));
    sourceSelect.appendChild(option.cloneNode(true));
    targetSelect.appendChild(option.cloneNode(true));
  });

  select.value = state.activeId;
  sourceSelect.value = state.wishlists[0]?.id || '';
  targetSelect.value = state.activeId;

  const activeList = state.wishlists.find((entry) => entry.id === state.activeId) || state.wishlists[0];
  if (!activeList) {
    activeWishlist.innerHTML = '<p>No wishlists yet.</p>';
    status.textContent = 'Create a wishlist to start.';
    return;
  }

  activeWishlist.innerHTML = '';
  if (activeList.items.length === 0) {
    activeWishlist.innerHTML = '<p>This wishlist is empty.</p>';
  } else {
    activeList.items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'wishlist-item';
      row.innerHTML = `
        <div>
          <strong>${item.name}</strong>
          <div class="meta">${item.category}</div>
        </div>
        <div class="price">$${item.price}</div>
      `;
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.textContent = 'Remove';
      removeButton.addEventListener('click', () => removeFromActiveWishlist(item.id));
      row.appendChild(removeButton);
      activeWishlist.appendChild(row);
    });
  }

  status.textContent = `${activeList.name} contains ${activeList.items.length} item(s).`;
}

function addProductToActiveWishlist(product) {
  const state = parseWishlists();
  const activeList = state.wishlists.find((entry) => entry.id === state.activeId) || state.wishlists[0];
  if (!activeList) return;

  const exists = activeList.items.some((entry) => entry.id === product.id);
  if (exists) {
    document.getElementById('wishlistStatus').textContent = `${product.name} is already in ${activeList.name}.`;
    return;
  }

  activeList.items.push({ id: product.id, name: product.name, price: product.price, category: product.category });
  saveWishlists({ wishlists: state.wishlists, activeId: state.activeId });
  renderWishlistControls({ wishlists: state.wishlists, activeId: state.activeId });
  document.getElementById('wishlistStatus').textContent = `${product.name} added to ${activeList.name}.`;
}

function removeFromActiveWishlist(productId) {
  const state = parseWishlists();
  const activeList = state.wishlists.find((entry) => entry.id === state.activeId) || state.wishlists[0];
  if (!activeList) return;

  activeList.items = activeList.items.filter((item) => item.id !== productId);
  saveWishlists({ wishlists: state.wishlists, activeId: state.activeId });
  renderWishlistControls({ wishlists: state.wishlists, activeId: state.activeId });
}

function createWishlist() {
  const input = document.getElementById('wishlistNameInput');
  const name = input.value.trim();
  if (!name) {
    document.getElementById('wishlistStatus').textContent = 'Please enter a wishlist name.';
    return;
  }

  const state = parseWishlists();
  const newList = { id: createId('wishlist'), name, items: [] };
  state.wishlists.push(newList);
  state.activeId = newList.id;
  saveWishlists(state);
  input.value = '';
  renderWishlistControls(state);
  document.getElementById('wishlistStatus').textContent = `Created ${name}.`;
}

function renameWishlist() {
  const state = parseWishlists();
  const activeList = state.wishlists.find((entry) => entry.id === state.activeId);
  if (!activeList) return;

  const newName = prompt('Rename wishlist', activeList.name);
  if (!newName) return;

  activeList.name = newName.trim();
  saveWishlists(state);
  renderWishlistControls(state);
}

function deleteWishlist() {
  const state = parseWishlists();
  const activeList = state.wishlists.find((entry) => entry.id === state.activeId);
  if (!activeList) return;

  if (!confirm(`Delete ${activeList.name}?`)) return;

  state.wishlists = state.wishlists.filter((entry) => entry.id !== state.activeId);
  state.activeId = state.wishlists[0]?.id || null;
  saveWishlists(state);
  renderWishlistControls(state);
}

function mergeWishlists() {
  const sourceId = document.getElementById('sourceWishlistSelect').value;
  const targetId = document.getElementById('targetWishlistSelect').value;
  if (!sourceId || !targetId || sourceId === targetId) {
    document.getElementById('wishlistStatus').textContent = 'Choose two different wishlists to merge.';
    return;
  }

  const state = parseWishlists();
  const targetList = state.wishlists.find((entry) => entry.id === targetId);
  const sourceList = state.wishlists.find((entry) => entry.id === sourceId);
  if (!targetList || !sourceList) return;

  const mergedItems = [...targetList.items];
  sourceList.items.forEach((item) => {
    const exists = mergedItems.some((entry) => entry.id === item.id);
    if (!exists) mergedItems.push(item);
  });

  targetList.items = mergedItems;
  state.activeId = targetList.id;
  saveWishlists(state);
  renderWishlistControls(state);
  document.getElementById('wishlistStatus').textContent = `Merged ${sourceList.name} into ${targetList.name}.`;
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
}

function bootstrap() {
  renderProducts();
  const state = parseWishlists();
  saveWishlists(state);
  renderWishlistControls(state);
  attachEvents();
}

bootstrap();
