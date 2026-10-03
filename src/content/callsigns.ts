import { pick, randInt, type Rng } from "./source.ts";

/**
 * Realistic amateur prefixes. Entries ending in a digit already carry the
 * call area; for the others a digit is appended.
 */
const PREFIXES = [
  // weighted towards common CW activity
  "K",
  "K",
  "W",
  "W",
  "N",
  "AA",
  "AB",
  "AC",
  "AD",
  "AE",
  "KA",
  "KB",
  "KC",
  "KD",
  "WA",
  "WB",
  "VE",
  "VA",
  "G",
  "M",
  "2E",
  "GM",
  "GW",
  "EI",
  "F",
  "DL",
  "DL",
  "DK",
  "DJ",
  "DO",
  "DF",
  "I",
  "IK",
  "IZ",
  "EA",
  "EA",
  "CT",
  "SM",
  "SM",
  "SA",
  "SE",
  "OH",
  "LA",
  "OZ",
  "TF",
  "PA",
  "PD",
  "ON",
  "HB9",
  "OE",
  "SP",
  "SP",
  "OK",
  "OM",
  "HA",
  "YO",
  "LZ",
  "S5",
  "9A",
  "YU",
  "SV",
  "UA",
  "R",
  "RA",
  "UR",
  "UT",
  "ES",
  "YL",
  "LY",
  "4X",
  "JA",
  "JH",
  "JR",
  "BY",
  "BV",
  "HL",
  "VK",
  "ZL",
  "ZS",
  "PY",
  "LU",
  "CE",
  "CX",
  "XE",
  "VU",
  "YB",
  "9V",
  "HS",
];

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function callsign(rng: Rng): string {
  const prefix = pick(PREFIXES, rng);
  const area = /\d$/.test(prefix) ? "" : String(randInt(0, 9, rng));
  const suffixLen = pick([1, 2, 2, 3, 3, 3], rng);
  let suffix = "";
  for (let i = 0; i < suffixLen; i++) suffix += pick([...LETTERS], rng);
  const portable = rng() < 0.05 ? pick(["/P", "/M", "/QRP"], rng) : "";
  return prefix + area + suffix + portable;
}
