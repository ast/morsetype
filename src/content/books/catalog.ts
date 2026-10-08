export interface Book {
  id: string;
  title: string;
  /** Short label for the picker. */
  short: string;
  author: string;
  gutenbergId: number;
}

/** Bundled Project Gutenberg texts; see scripts/fetch-books.ts. */
export const BOOKS: readonly Book[] = [
  {
    id: "alice",
    title: "Alice's Adventures in Wonderland",
    short: "alice",
    author: "Lewis Carroll",
    gutenbergId: 11,
  },
  {
    id: "treasure",
    title: "Treasure Island",
    short: "treasure island",
    author: "Robert Louis Stevenson",
    gutenbergId: 120,
  },
  {
    id: "holmes",
    title: "The Adventures of Sherlock Holmes",
    short: "sherlock holmes",
    author: "Arthur Conan Doyle",
    gutenbergId: 1661,
  },
  {
    id: "worlds",
    title: "The War of the Worlds",
    short: "war of the worlds",
    author: "H. G. Wells",
    gutenbergId: 36,
  },
  {
    id: "pride",
    title: "Pride and Prejudice",
    short: "pride & prejudice",
    author: "Jane Austen",
    gutenbergId: 1342,
  },
  {
    id: "eighty",
    title: "Around the World in Eighty Days",
    short: "80 days",
    author: "Jules Verne",
    gutenbergId: 103,
  },
];

export const BOOK_IDS: readonly string[] = BOOKS.map((b) => b.id);
export const DEFAULT_BOOK = BOOKS[0]!.id;

export function bookById(id: string): Book | undefined {
  return BOOKS.find((b) => b.id === id);
}
