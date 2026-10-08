import { normalize } from "../morse/alphabet.ts";
import { callsign } from "./callsigns.ts";
import { NAMES } from "./ham.ts";
import { chance, pick, randInt, type Rng, scriptSource, type WordSource } from "./source.ts";
import { words } from "./qso.ts";

export type ContestKind = "cqww" | "wpx" | "cwt" | "fd";
export const CONTEST_KINDS: readonly ContestKind[] = ["cqww", "wpx", "cwt", "fd"];
export const CONTEST_LABELS: Readonly<Record<ContestKind, string>> = {
  cqww: "cq ww",
  wpx: "wpx / sac",
  cwt: "cwt",
  fd: "field day",
};

/** CQ zones by prefix; US/VE by call area. Anything else gets a random zone. */
const ZONES: readonly [RegExp, number][] = [
  [/^(G|M|2E|GM|GW|EI|F|DL|DK|DJ|DO|DF|EA|CT|SM|SA|SE|LA|OZ|PA|PD|ON|HB9)\d/, 14],
  [/^(I|IK|IZ|OH|OE|SP|OK|OM|HA|S5|9A|YU|ES|YL|LY)\d/, 15],
  [/^(YO|LZ|SV|4X)\d/, 20],
  [/^(UA|R|RA|UR|UT)\d/, 16],
  [/^TF\d/, 40],
  [/^(JA|JH|JR|HL)\d/, 25],
  [/^BY\d/, 24],
  [/^BV\d/, 24],
  [/^VK\d/, 30],
  [/^ZL\d/, 32],
  [/^ZS\d/, 38],
  [/^PY\d/, 11],
  [/^(LU|CX)\d/, 13],
  [/^CE\d/, 12],
  [/^XE\d/, 6],
  [/^VU\d/, 22],
  [/^(YB|9V)\d/, 28],
  [/^HS\d/, 26],
];

export function zoneOf(call: string, rng: Rng): number {
  const us = /^(?:K|W|N|A[A-L]|K[A-Z]|W[A-Z])(\d)/.exec(call);
  if (us) {
    const area = Number(us[1]);
    return area >= 1 && area <= 4 ? 5 : area === 6 || area === 7 ? 3 : 4;
  }
  const ve = /^V[AE](\d)/.exec(call);
  if (ve) {
    const area = Number(ve[1]);
    return area <= 2 || area === 9 ? 5 : area === 7 ? 3 : 4;
  }
  for (const [re, zone] of ZONES) if (re.test(call)) return zone;
  return randInt(1, 40, rng);
}

const US_STATES = [
  "CT",
  "MA",
  "ME",
  "NH",
  "RI",
  "VT",
  "NY",
  "NJ",
  "PA",
  "DE",
  "MD",
  "VA",
  "NC",
  "SC",
  "GA",
  "FL",
  "AL",
  "TN",
  "KY",
  "OH",
  "MI",
  "IN",
  "IL",
  "WI",
  "MN",
  "IA",
  "MO",
  "AR",
  "LA",
  "MS",
  "TX",
  "OK",
  "KS",
  "NE",
  "SD",
  "ND",
  "MT",
  "WY",
  "CO",
  "NM",
  "AZ",
  "UT",
  "ID",
  "WA",
  "OR",
  "NV",
  "CA",
  "AK",
  "HI",
  "WV",
];

const ARRL_SECTIONS = [
  "CT",
  "EMA",
  "ME",
  "NH",
  "RI",
  "VT",
  "WMA",
  "ENY",
  "NLI",
  "NNJ",
  "NNY",
  "SNJ",
  "WNY",
  "DE",
  "EPA",
  "MDC",
  "WPA",
  "AL",
  "GA",
  "KY",
  "NC",
  "NFL",
  "SC",
  "SFL",
  "WCF",
  "TN",
  "VA",
  "PR",
  "AR",
  "LA",
  "MS",
  "NM",
  "NTX",
  "OK",
  "STX",
  "WTX",
  "EB",
  "LAX",
  "ORG",
  "SB",
  "SCV",
  "SDG",
  "SF",
  "SJV",
  "SV",
  "PAC",
  "AZ",
  "EWA",
  "ID",
  "MT",
  "NV",
  "OR",
  "UT",
  "WWA",
  "WY",
  "AK",
  "MI",
  "OH",
  "WV",
  "IL",
  "IN",
  "WI",
  "CO",
  "IA",
  "KS",
  "MN",
  "MO",
  "NE",
  "ND",
  "SD",
  "MAR",
  "ONE",
  "ONN",
  "ONS",
  "QC",
  "MB",
  "SK",
  "AB",
  "BC",
  "NT",
];

const isNorthAmerican = (call: string) => /^(?:K|W|N|A[A-L]|V[AE])/.test(call);

function northAmericanCall(rng: Rng): string {
  for (let i = 0; i < 30; i++) {
    const c = callsign(rng);
    if (isNorthAmerican(c) && !c.includes("/")) return c;
  }
  return "W1AW";
}

/** Contest numbers are often sent with cut numbers: T for 0, N for 9. */
export function cutNumber(n: string, rng: Rng): string {
  if (!chance(0.4, rng)) return n;
  return n.replace(/0/g, "T").replace(/9/g, "N");
}

function serial(n: number, rng: Rng): string {
  return cutNumber(String(n).padStart(3, "0"), rng);
}

function rst(rng: Rng): string {
  return chance(0.7, rng) ? "5NN" : "599";
}

/** The exchange a station sends in a given contest, without RST. */
function exchange(kind: ContestKind, call: string, nr: number, rng: Rng): string {
  switch (kind) {
    case "cqww":
      return cutNumber(String(zoneOf(call, rng)), rng);
    case "wpx":
      return serial(nr, rng);
    case "cwt": {
      const name = pick(NAMES, rng);
      if (chance(0.7, rng)) return `${name} ${cutNumber(String(randInt(100, 39999, rng)), rng)}`;
      const loc = isNorthAmerican(call) ? pick(US_STATES, rng) : call.replace(/\d.*$/, "");
      return `${name} ${loc}`;
    }
    case "fd":
      return `${randInt(1, 5, rng)}${pick(["A", "A", "A", "B", "D", "E", "F"], rng)} ${
        pick(ARRL_SECTIONS, rng)
      }`;
  }
}

function cq(kind: ContestKind, r: string, rng: Rng): string {
  switch (kind) {
    case "cqww":
      return pick([`CQ TEST ${r} ${r} TEST`, `CQ WW ${r} ${r}`, `TEST ${r} ${r} TEST`], rng);
    case "wpx":
      return pick([`CQ TEST ${r} ${r} TEST`, `CQ WPX ${r} ${r}`, `CQ SAC ${r} ${r} TEST`], rng);
    case "cwt":
      return pick([`CQ CWT ${r}`, `CQ CWT ${r} ${r}`, `CWT ${r} TEST`], rng);
    case "fd":
      return pick([`CQ FD ${r} ${r} FD`, `CQ FD ${r}`, `CQ FD DE ${r} ${r} K`], rng);
  }
}

/** What a caller asks when the exchange was missed. */
const QUERIES: Readonly<Record<ContestKind, readonly string[]>> = {
  cqww: ["NR?", "ZONE?"],
  wpx: ["NR?", "NR? NR?"],
  cwt: ["NR?", "NAME?"],
  fd: ["SEC?", "CLASS?", "AGN? AGN?"],
};

export interface ContestOver {
  from: "runner" | "caller";
  words: string[];
}

/** One contest QSO between the running station `r` (serial `nr`) and caller `c`. */
export function generateContestQso(
  kind: ContestKind,
  r: string,
  c: string,
  nr: number,
  rng: Rng,
): ContestOver[] {
  const overs: ContestOver[] = [];
  const say = (from: ContestOver["from"], text: string) => overs.push({ from, words: words(text) });
  const withRst = kind === "cqww" || kind === "wpx";
  const rx = exchange(kind, r, nr, rng);
  const cx = exchange(kind, c, randInt(1, 999, rng), rng);

  say("runner", cq(kind, r, rng));
  say("caller", chance(0.2, rng) ? `${c} ${c}` : c);
  say("runner", withRst ? `${c} ${rst(rng)} ${rx}` : `${c} ${rx}`);
  if (chance(0.15, rng)) {
    say("caller", pick(["AGN?", ...QUERIES[kind]], rng));
    say("runner", `${rx} ${rx}`);
  }
  const lead = pick(["TU ", "R ", ""], rng);
  say("caller", withRst ? `${lead}${rst(rng)} ${cx}` : `${lead}${cx}`);
  say("runner", pick([`TU ${r} TEST`, `TU`, `R TEST`, `TU ${r}`], rng));
  return overs;
}

/**
 * Sample contest QSOs back to back. With `myCall` set you are the running station: only the
 * callers' transmissions are sent, as when working a pile-up.
 */
export function contestSource(kind: ContestKind, rng: Rng, myCall = ""): WordSource {
  const me = normalize(myCall);
  const pickCall = kind === "fd" ? northAmericanCall : callsign;
  const runner = me !== "" ? me : pickCall(rng);
  let nr = randInt(1, 400, rng);
  return scriptSource(() => {
    const caller = pickCall(rng);
    const overs = generateContestQso(kind, runner, caller, nr++, rng);
    return overs.filter((o) => me === "" || o.from === "caller").map((o) => o.words);
  });
}
