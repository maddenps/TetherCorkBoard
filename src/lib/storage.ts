import { normalizeBoard } from "./model";
import type { Board } from "./types";

// Everything lives in the browser (IndexedDB) so the app works with no signal.

const DB_NAME = "tethercorkboard";
const STORE = "boards";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(req.result);
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadBoards(): Promise<Board[]> {
  try {
    const raw = await run<unknown[]>("readonly", (s) => s.getAll());
    // Stored boards are untrusted: anything odd is repaired, and anything unusable is skipped, never thrown.
    const all = raw.map(normalizeBoard).filter((b): b is Board => !!b);
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (e) {
    console.warn("Could not read boards from IndexedDB", e);
    return [];
  }
}

export async function saveBoard(board: Board): Promise<void> {
  try {
    await run("readwrite", (s) => s.put(board));
  } catch (e) {
    console.warn("Could not save board", e);
  }
}

export async function deleteBoard(id: string): Promise<void> {
  try {
    await run("readwrite", (s) => s.delete(id));
  } catch (e) {
    console.warn("Could not delete board", e);
  }
}
