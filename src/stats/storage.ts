import { readJson, writeJson } from "../lib/persist";
import type { StatsData } from "./stats";
import { emptyStats } from "./stats";

/** Persistence boundary for stats; a remote store can implement this later. */
export interface StatsStore {
  load(): StatsData;
  save(data: StatsData): void;
}

const KEY = "morsetype.stats";

export const localStatsStore: StatsStore = {
  load() {
    const data = readJson<StatsData>(KEY);
    return data?.version === 1 ? data : emptyStats();
  },
  save(data) {
    writeJson(KEY, data);
  },
};
