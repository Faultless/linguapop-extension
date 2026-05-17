/**
 * Minimal IndexedDB key-value wrapper. No deps.
 * One DB ("linguapop"), one store ("kv"), string keys.
 *
 * Used to store novel bodies (chapters can be MB-scale, beyond localStorage).
 */

const DB_NAME = 'linguapop'
const DB_VERSION = 1
const STORE = 'kv'

let dbPromise: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return open().then(db => new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const store = tx.objectStore(STORE)
    let result: T | undefined
    const req = fn(store)
    if (req) req.onsuccess = () => { result = req.result }
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  }))
}

export const idb = {
  get<T = unknown>(key: string): Promise<T | undefined> {
    return run<T>('readonly', s => s.get(key) as IDBRequest<T>)
  },
  set(key: string, value: unknown): Promise<void> {
    return run<void>('readwrite', s => { s.put(value, key) }) as Promise<void>
  },
  del(key: string): Promise<void> {
    return run<void>('readwrite', s => { s.delete(key) }) as Promise<void>
  },
  keys(): Promise<string[]> {
    return run<IDBValidKey[]>('readonly', s => s.getAllKeys() as IDBRequest<IDBValidKey[]>)
      .then(ks => (ks || []).map(String))
  },
}
