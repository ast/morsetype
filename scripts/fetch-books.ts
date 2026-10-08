/**
 * Download the catalogued Project Gutenberg texts and prepare them for sending:
 *
 *   deno task books          # first 40 000 words of each book (cut at a sentence end)
 *   deno task books --full   # whole books
 *
 * Output goes to src/content/books/texts/<id>.txt and is committed; the app never fetches
 * from gutenberg.org (it sends no CORS headers).
 */
import { BOOKS } from "../src/content/books/catalog.ts";
import { prepareText, truncateAtSentence } from "../src/content/books/prepare.ts";

const MAX_WORDS = 40_000;
const full = Deno.args.includes("--full");
const outDir = new URL("../src/content/books/texts/", import.meta.url);
await Deno.mkdir(outDir, { recursive: true });

for (const book of BOOKS) {
  const url = `https://www.gutenberg.org/cache/epub/${book.gutenbergId}/pg${book.gutenbergId}.txt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${book.id}: ${res.status} ${res.statusText} for ${url}`);
  const words = prepareText(await res.text());
  const kept = full ? words : truncateAtSentence(words, MAX_WORDS);
  const out = new URL(`${book.id}.txt`, outDir);
  await Deno.writeTextFile(out, kept.join(" ") + "\n");
  console.log(`${book.id}: ${kept.length}/${words.length} words`);
}
