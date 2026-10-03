import { normalize } from "../morse/alphabet";
import { callsign } from "./callsigns";
import { noRepeat, pick, randInt, type Rng, type WordSource } from "./source";

export const Q_CODES = [
  "QRL", "QRM", "QRN", "QRO", "QRP", "QRQ", "QRS", "QRT", "QRU", "QRV", "QRX", "QRZ",
  "QSB", "QSL", "QSO", "QSY", "QTH", "QTR",
];

export const ABBREVIATIONS = [
  "CQ", "DE", "K", "TU", "73", "88", "GM", "GA", "GE", "GN", "OM", "YL", "XYL", "FB", "UR",
  "RST", "5NN", "599", "579", "559", "NAME", "OP", "RIG", "ANT", "PWR", "WX", "HR", "ES",
  "FER", "PSE", "AGN", "BK", "CUL", "HW", "CPY", "TNX", "TKS", "SRI", "WID", "ABT", "DX",
  "CONDX", "BAND", "HPE", "GL", "SIG", "R", "NR", "INFO", "WKD", "TEST", "POTA", "SOTA",
  "DIPOLE", "VERT", "YAGI", "EFHW", "KW", "W", "BUG", "PADDLE", "SKCC", "FISTS", "CW",
];

export function hamSource(rng: Rng): WordSource {
  const vocab = [...Q_CODES, ...ABBREVIATIONS];
  return noRepeat(() => (rng() < 0.15 ? callsign(rng) : pick(vocab, rng)));
}

export function callsignSource(rng: Rng): WordSource {
  return noRepeat(() => callsign(rng));
}

const NAMES = [
  "JOHN", "BOB", "BILL", "TOM", "JIM", "MIKE", "DAVE", "ANNA", "EVA", "HANS", "PETER",
  "LARS", "ULF", "OLLE", "KARL", "PAUL", "MARIA", "SUE", "KEN", "JAN", "PIET", "LUC",
  "MARCO", "JOSE", "IVAN", "YURI", "TAKA", "STEVE", "ED", "AL", "RON", "JOE",
];

const QTHS = [
  "STOCKHOLM", "LONDON", "PARIS", "BERLIN", "MUNICH", "ROME", "MADRID", "OSLO", "HELSINKI",
  "TOKYO", "BOSTON", "DENVER", "TEXAS", "OHIO", "SYDNEY", "TORONTO", "LISBON", "PRAGUE",
  "VIENNA", "WARSAW", "UPPSALA", "GOTEBORG", "DUBLIN", "ZURICH", "KIEV", "RIGA",
];

const RIGS = ["IC7300", "K3", "KX2", "KX3", "FT991", "FT710", "TS590", "QCX", "IC705", "K4", "HOMEBREW"];

const ANTENNAS = ["DIPOLE", "VERT", "YAGI", "EFHW", "LOOP", "WIRE", "GP", "INV V", "LW"];

/**
 * Generates realistic rag-chew style exchanges, one QSO at a time, and hands
 * them out word by word.
 */
export function qsoSource(rng: Rng): WordSource {
  let queue: string[] = [];

  const exchange = (): string => {
    const a = callsign(rng);
    const b = callsign(rng);
    const rst = pick(["599", "579", "569", "559", "449", "5NN", "339"], rng);
    const pwr = pick(["5W", "10W", "50W", "100W", "500W", "1KW"], rng);
    const part = randInt(0, 4, rng);
    switch (part) {
      case 0:
        return `CQ CQ CQ DE ${a} ${a} K`;
      case 1:
        return `${a} DE ${b} GM ES TNX FER CALL UR RST ${rst} ${rst} BK`;
      case 2:
        return `${b} DE ${a} R TNX NAME ${pick(NAMES, rng)} QTH ${pick(QTHS, rng)} HW CPY ${b} DE ${a} K`;
      case 3:
        return `RIG ${pick(RIGS, rng)} PWR ${pwr} ANT ${pick(ANTENNAS, rng)} WX ${pick(["SUNNY", "RAIN", "CLOUDY", "SNOW", "COLD", "WARM"], rng)} TEMP ${randInt(0, 30, rng)}C`;
      default:
        return `TNX FER FB QSO ${pick(NAMES, rng)} HPE CUL 73 ${b} DE ${a} TU`;
    }
  };

  return {
    next() {
      if (queue.length === 0) queue = exchange().split(/\s+/).map(normalize).filter(Boolean);
      return queue.shift()!;
    },
  };
}
