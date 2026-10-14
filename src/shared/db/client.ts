import "server-only";
import { connect } from "./connect";

type Db = ReturnType<typeof connect>;

// Kept on globalThis so dev HMR re-evaluating this module reuses one connection.
const globalForDb = globalThis as typeof globalThis & { __boardDb?: Db };

// Connects on first use, not on import: `next build` evaluates route modules in
// several workers at once, and opening the file there makes them race on the
// SQLite lock.
export function getDb(): Db {
  globalForDb.__boardDb ??= connect();
  return globalForDb.__boardDb;
}
