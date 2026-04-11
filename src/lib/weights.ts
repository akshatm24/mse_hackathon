import { UserConstraints } from "@/types";

type PriorityWeights = UserConstraints["priorityWeights"];

const WEIGHT_KEYS = [
  "thermal",
  "strength",
  "weight",
  "cost",
  "corrosion"
] as const;

export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  thermal: 0.18,
  strength: 0.28,
  weight: 0.18,
  cost: 0.28,
  corrosion: 0.08
};

export function normalisePriorityWeights(
  weights?: Partial<PriorityWeights>
): PriorityWeights {
  const raw = WEIGHT_KEYS.map((key) => {
    const value = weights?.[key];
    return Number.isFinite(value) ? Math.max(0, value as number) : 0;
  });
  const total = raw.reduce((sum, value) => sum + value, 0);

  if (total <= 0) {
    return DEFAULT_PRIORITY_WEIGHTS;
  }

  const scaled = raw.map((value) => value / total);
  const thousandths = scaled.map((value) => Math.floor(value * 1000));
  let remainder = 1000 - thousandths.reduce((sum, value) => sum + value, 0);

  const fractions = scaled
    .map((value, index) => ({
      index,
      fraction: value * 1000 - thousandths[index]
    }))
    .sort((left, right) => right.fraction - left.fraction);

  let cursor = 0;
  while (remainder > 0) {
    thousandths[fractions[cursor % fractions.length].index] += 1;
    remainder -= 1;
    cursor += 1;
  }

  return {
    thermal: thousandths[0] / 1000,
    strength: thousandths[1] / 1000,
    weight: thousandths[2] / 1000,
    cost: thousandths[3] / 1000,
    corrosion: thousandths[4] / 1000
  };
}
