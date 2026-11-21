/**
 * Minimal IndexedDB blob store for local images. Images never leave the device.
 * localStorage is unsuitable for image data (small quota, string-only).
 */
const DB_NAME = 'lego-adventure';
const DB_VERSION = 1;
const STORE = 'images';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open IndexedDB'));
    request.onblocked = () => reject(new Error('IndexedDB open was blocked'));
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = run(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
    });
  } finally {
    db.close();
  }
}

/**
 * Images are stored as raw bytes plus their MIME type rather than as Blobs: some WebKit contexts
 * (e.g. Safari private browsing and automated sessions) cannot store Blobs in IndexedDB.
 */
interface StoredImage {
  type: string;
  data: ArrayBuffer;
}

export async function putImage(key: string, blob: Blob): Promise<void> {
  const record: StoredImage = { type: blob.type, data: await blob.arrayBuffer() };
  await withStore('readwrite', (store) => store.put(record, key));
}

export async function getImage(key: string): Promise<Blob | null> {
  const value = await withStore<unknown>('readonly', (store) => store.get(key));
  if (value instanceof Blob) return value; // written by an earlier version
  if (typeof value === 'object' && value !== null && (value as StoredImage).data instanceof ArrayBuffer) {
    const stored = value as StoredImage;
    return new Blob([stored.data], { type: stored.type });
  }
  return null;
}

export async function deleteImage(key: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(key));
}
