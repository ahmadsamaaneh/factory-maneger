const DB_NAME = 'factory-offline-db';
const DB_VERSION = 1;
const STORE = 'cash_van_sales_queue';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB.'));
  });
}

function tx(storeName, mode, fn) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const result = fn(store);
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted.'));
  }));
}

export async function enqueueCashVanSale(payload) {
  const row = {
    payload,
    created_at: new Date().toISOString(),
  };
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    const request = store.add(row);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to enqueue offline sale.'));
  });
}

export async function listQueuedCashVanSales() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly');
    const store = transaction.objectStore(STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      const rows = (request.result || []).map((r) => ({ ...r }));
      rows.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      resolve(rows);
    };
    request.onerror = () => reject(request.error || new Error('Failed to read offline queue.'));
  });
}

export async function removeQueuedCashVanSale(id) {
  return tx(STORE, 'readwrite', (store) => store.delete(id));
}

export async function syncQueuedCashVanSales(sendFn) {
  const rows = await listQueuedCashVanSales();
  let synced = 0;
  for (const row of rows) {
    await sendFn(row.payload);
    await removeQueuedCashVanSale(row.id);
    synced += 1;
  }
  return synced;
}
