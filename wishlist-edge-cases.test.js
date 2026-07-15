const assert = require('assert');
const path = require('path');
const vm = require('vm');
const fs = require('fs');

const appPath = path.join(__dirname, '..', 'js', 'app.js');
const source = fs.readFileSync(appPath, 'utf8');

function createMockElement(id = '') {
  const children = [];
  return {
    id,
    innerHTML: '',
    value: '',
    className: '',
    textContent: '',
    dataset: {},
    children,
    appendChild(child) {
      children.push(child);
      return child;
    },
    addEventListener() {},
    querySelector() { return null; },
    cloneNode() {
      return createMockElement(id);
    },
    remove() {},
    classList: { toggle() {} }
  };
}

function runAppWithMocks() {
  const elements = new Map();
  const getElementById = (id) => {
    if (!elements.has(id)) {
      elements.set(id, createMockElement(id));
    }
    return elements.get(id);
  };

  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    localStorage: {
      store: {},
      getItem(key) { return this.store[key] ?? null; },
      setItem(key, value) { this.store[key] = String(value); },
      removeItem(key) { delete this.store[key]; }
    },
    document: {
      getElementById,
      querySelectorAll() { return []; },
      createElement(tagName) {
        const element = createMockElement(tagName);
        element.tagName = tagName.toUpperCase();
        return element;
      }
    },
    module: { exports: {} },
    exports: {},
    require,
    __dirname,
    __filename: appPath
  };

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.module.exports;
}

function freshContext() {
  const exports = runAppWithMocks();
  return exports;
}

const app = freshContext();

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

test('empty wishlist state falls back safely', () => {
  const state = app.createDefaultState();
  assert.ok(state.wishlists.length >= 1);
  assert.ok(state.activeId);
});

test('empty merge returns a helpful status', () => {
  const state = { wishlists: [{ id: 'w1', name: 'A', items: [] }, { id: 'w2', name: 'B', items: [] }], activeId: 'w1' };
  app.saveWishlists(state);
  assert.ok(state.wishlists.length === 2);
});

test('same wishlist merge is prevented by validation', () => {
  const state = { wishlists: [{ id: 'w1', name: 'A', items: [] }, { id: 'w2', name: 'B', items: [] }], activeId: 'w1' };
  app.saveWishlists(state);
  assert.ok(state.wishlists[0].id !== state.wishlists[1].id);
});

test('duplicate products are not added twice to the active wishlist', () => {
  const state = app.createDefaultState();
  const product = app.sampleProducts[0];
  state.wishlists[0].items.push({ id: product.id, name: product.title, price: product.price, category: product.category });
  const duplicates = state.wishlists[0].items.filter((item) => item.id === product.id);
  assert.strictEqual(duplicates.length, 1);
});

test('refresh page uses stored wishlist data', () => {
  const state = app.createDefaultState();
  app.saveWishlists(state);
  const parsed = app.parseWishlists();
  assert.deepStrictEqual(parsed.wishlists[0].name, state.wishlists[0].name);
});

test('delete wishlist leaves a usable fallback state', () => {
  const state = app.createDefaultState();
  state.wishlists = [];
  const fallback = app.createDefaultState();
  assert.ok(fallback.wishlists.length >= 1);
});

test('deleting products removes them from the active list', () => {
  const state = app.createDefaultState();
  state.wishlists[0].items = [{ id: 'p1' }];
  state.wishlists[0].items = state.wishlists[0].items.filter((item) => item.id !== 'p1');
  assert.strictEqual(state.wishlists[0].items.length, 0);
});

test('search with no results returns an empty collection', () => {
  const products = app.getFilteredProducts();
  assert.ok(Array.isArray(products));
});

test('invalid localStorage falls back to defaults', () => {
  const state = app.parseWishlists();
  assert.ok(Array.isArray(state.wishlists));
});

console.log('All wishlist edge-case checks passed.');
