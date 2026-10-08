import { normalize } from "../morse/alphabet.ts";
import { callsign } from "./callsigns.ts";
import { ANTENNAS, NAMES, QTHS, RIGS } from "./ham.ts";
import { chance, pick, randInt, type Rng, scriptSource, type WordSource } from "./source.ts";

/** Prosigns as the single characters they are sent and typed as. */
export const AR = "+";
export const KN = "(";
export const SK = "<";
export const BT = "=";

const RSTS = ["599", "599", "599", "589", "579", "579", "569", "559", "449"];
const POWERS = ["5W", "10W", "50W", "100W", "100W", "100W", "400W", "1KW"];
const WX = ["SUNNY", "RAIN", "CLOUDY", "SNOW", "COLD", "WARM", "WINDY", "FOG", "CLR", "OVERCAST"];
const GREETINGS = ["GM", "GA", "GE"];

interface Station {
  call: string;
  name: string;
  qth: string;
  rig: string;
  ant: string;
  pwr: string;
  wx: string;
  temp: number;
  /** The report this station gives the other one. */
  rst: string;
}

/** One transmission: who sends it and the words. */
export interface Over {
  from: "a" | "b";
  words: string[];
}

function station(rng: Rng, call = callsign(rng)): Station {
  return {
    call,
    name: pick(NAMES, rng),
    qth: pick(QTHS, rng),
    rig: pick(RIGS, rng),
    ant: pick(ANTENNAS, rng),
    pwr: pick(POWERS, rng),
    wx: pick(WX, rng),
    temp: randInt(0, 30, rng),
    rst: pick(RSTS, rng),
  };
}

/** 599 is often sent with cut numbers. */
function cutRst(rst: string, rng: Rng): string {
  return rst === "599" && chance(0.5, rng) ? "5NN" : rst;
}

/** Split a template into sendable words. */
export function words(text: string): string[] {
  return text.split(/\s+/).map(normalize).filter((w) => w !== "");
}

/**
 * Build one complete QSO as a list of overs. `a` calls CQ, `b` answers. Rag-chew by default
 * (RST, name, QTH, then rig/antenna/weather, then 73s); a quarter of QSOs are the short kind.
 */
export function generateQso(rng: Rng, a: Station, b: Station): Over[] {
  const A = a.call;
  const B = b.call;
  const greet = pick(GREETINGS, rng);
  const overs: Over[] = [];
  const say = (from: "a" | "b", text: string) => overs.push({ from, words: words(text) });

  // CQ
  const cq = pick(
    [`CQ CQ CQ DE ${A} ${A} ${A} K`, `CQ CQ CQ DE ${A} ${A} ${A} PSE K`, `CQ CQ DE ${A} ${A} K`],
    rng,
  );
  if (chance(0.3, rng)) say("a", `CQ CQ CQ DE ${A} ${A} ${A} ${cq}`);
  else say("a", cq);

  // Answer
  say(
    "b",
    pick([
      `${A} DE ${B} ${B} ${B} ${KN}`,
      `${A} ${A} DE ${B} ${B} ${B} ${AR}`,
      `${A} DE ${B} ${B} K`,
    ], rng),
  );

  if (chance(0.25, rng)) {
    // Short QSO: everything in one over each.
    const rstA = cutRst(a.rst, rng);
    const rstB = cutRst(b.rst, rng);
    say(
      "a",
      `${B} DE ${A} ${greet} TNX FER CALL UR ${rstA} ${rstA} NAME ${a.name} ${a.name} QTH ${a.qth} ${a.qth} HW? ${B} DE ${A} ${KN}`,
    );
    say(
      "b",
      `${A} DE ${B} R TU ${a.name} UR ${rstB} ${rstB} NAME ${b.name} ${b.name} QTH ${b.qth} ${b.qth} 73 ${A} DE ${B} ${SK}`,
    );
    say(
      "a",
      pick([
        `${B} DE ${A} TU 73 ${b.name} ${SK} E E`,
        `${B} DE ${A} R R 73 ${b.name} ${B} DE ${A} ${SK}`,
      ], rng),
    );
    return overs;
  }

  // First exchange from A: report, name, QTH.
  const rstA = cutRst(a.rst, rng);
  say(
    "a",
    pick(
      [
        `${B} DE ${A} ${BT} ${greet} OM ES TNX FER CALL ${BT} UR RST ${rstA} ${rstA} ${BT} NAME ${a.name} ${a.name} ${BT} QTH ${a.qth} ${a.qth} ${BT} HW CPY? ${B} DE ${A} ${KN}`,
        `${B} DE ${A} ${greet} ES TNX FER CALL ${BT} UR RST IS ${rstA} ${rstA} ${BT} MY NAME IS ${a.name} ${a.name} ${BT} QTH IS ${a.qth} ${a.qth} ${BT} SO HW? ${B} DE ${A} ${KN}`,
      ],
      rng,
    ),
  );

  // Sometimes B missed something and asks again.
  if (chance(0.15, rng)) {
    const what = pick(["NAME", "QTH"], rng);
    say("b", `${A} DE ${B} ${BT} SRI QRM ${BT} UR ${what} AGN? ${BT} ${A} DE ${B} ${KN}`);
    const rep = what === "NAME" ? a.name : a.qth;
    say("a", `${B} DE ${A} ${BT} ${what} ${rep} ${rep} ${rep} ${BT} ${B} DE ${A} ${KN}`);
  }

  // B replies in kind.
  const rstB = cutRst(b.rst, rng);
  say(
    "b",
    pick(
      [
        `${A} DE ${B} ${BT} R R R ${greet} ${a.name} ES TNX FER RPRT ${BT} UR RST ${rstB} ${rstB} ${BT} NAME ${b.name} ${b.name} ${BT} QTH ${b.qth} ${b.qth} ${BT} HW? ${A} DE ${B} ${KN}`,
        `${A} DE ${B} ${BT} R R OK ${a.name} TNX FER FB RPRT ${BT} UR RST ${rstB} ${rstB} ${BT} OP ${b.name} ${b.name} ${BT} QTH ${b.qth} ${b.qth} ${BT} HW CPY? ${A} DE ${B} ${KN}`,
      ],
      rng,
    ),
  );

  // Station details.
  const qsb = chance(0.15, rng) ? `${BT} QSB ON UR SIG ` : "";
  say(
    "a",
    pick(
      [
        `${B} DE ${A} ${BT} R R FB ${b.name} TNX ${qsb}${BT} RIG HR IS ${a.rig} ES ANT ${a.ant} UP ${
          randInt(5, 20, rng)
        }M ${BT} PWR ${a.pwr} ${BT} WX HR ${a.wx} TEMP ${a.temp}C ${BT} SO HW? ${B} DE ${A} ${KN}`,
        `${B} DE ${A} ${BT} R OK ${b.name} ${qsb}${BT} RIG ${a.rig} PWR ${a.pwr} ${BT} ANT ${a.ant} ${BT} WX ${a.wx} ES ${a.temp}C ${BT} HW? ${B} DE ${A} ${KN}`,
      ],
      rng,
    ),
  );
  const qru = chance(0.2, rng) ? `${BT} QRU ` : "";
  say(
    "b",
    pick(
      [
        `${A} DE ${B} ${BT} R OK ${a.name} ${BT} RIG HR ${b.rig} PWR ${b.pwr} ANT ${b.ant} ${BT} WX ${b.wx} ${b.temp}C ${qru}${BT} TNX FER FB QSO ${a.name} ES HPE CUL ${BT} 73 73 ${A} DE ${B} ${SK}`,
        `${A} DE ${B} ${BT} R R FB ${a.name} ${BT} RIG IS ${b.rig} ES ANT ${b.ant} ${BT} PWR ${b.pwr} ${BT} WX HR ${b.wx} ${qru}${BT} TNX FER NICE QSO ES GL ES GUD DX ${BT} 73 ${A} DE ${B} ${SK}`,
      ],
      rng,
    ),
  );

  // Final.
  say(
    "a",
    pick(
      [
        `${B} DE ${A} ${BT} R TNX FER FB QSO ${b.name} ${BT} 73 ES GL ${BT} ${B} DE ${A} ${SK} E E`,
        `${B} DE ${A} TU 73 ${b.name} CUL ${B} DE ${A} ${SK}`,
        `${B} DE ${A} R R 73 73 GL ${b.name} ${B} DE ${A} ${SK} EE`,
      ],
      rng,
    ),
  );
  return overs;
}

/**
 * Split an over into the phrases between <BT>s, each keeping its trailing <BT>. These are the
 * natural pauses a session may stop at.
 */
export function phrases(over: readonly string[]): string[][] {
  const out: string[][] = [];
  let cur: string[] = [];
  for (const w of over) {
    cur.push(w);
    if (w === BT) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

/**
 * Realistic QSOs, one after another. With `myCall` set, the other station works you: you are
 * randomly the one calling CQ or the one answering, and only the other side is sent.
 */
export function qsoSource(rng: Rng, myCall = ""): WordSource {
  const me = normalize(myCall);
  return scriptSource(() => {
    const side: "a" | "b" | null = me === "" ? null : chance(0.5, rng) ? "a" : "b";
    const a = station(rng, side === "a" ? me : undefined);
    const b = station(rng, side === "b" ? me : undefined);
    return generateQso(rng, a, b)
      .filter((o) => side === null || o.from !== side)
      .flatMap((o) => phrases(o.words));
  });
}
