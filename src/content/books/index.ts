/**
 * Lazy access to the bundled book texts. Vite turns each `texts/*.txt` into its own chunk,
 * so a book is only downloaded when a session asks for it. Browser-only: not imported by
 * tests (`import.meta.glob` is a Vite feature).
 */
const loaders = import.meta.glob("./texts/*.txt", { query: "?raw", import: "default" });
const cache = new Map<string, Promise<string>>();

export function loadBook(id: string): Promise<string> {
  const key = `./texts/${id}.txt`;
  let p = cache.get(key);
  if (!p) {
    const load = loaders[key];
    if (!load) return Promise.reject(new Error(`unknown book: ${id}`));
    p = load().then((text) => text as string);
    cache.set(key, p);
  }
  return p;
}
