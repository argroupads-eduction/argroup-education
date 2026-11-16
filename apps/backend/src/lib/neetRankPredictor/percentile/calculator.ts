import { clamp } from '../interpolation/piecewise';
import { getPrimaryDataset } from '../data/registry';

export function percentileFromAir(air: number, totalAppeared?: number): { value: number; label: string } {
  const total = totalAppeared ?? getPrimaryDataset().totalAppeared;
  const p = clamp((1 - air / total) * 100, 0.01, 99.9999);
  const rounded = Math.round(p * 10000) / 10000;
  let label: string;
  if (rounded >= 99.999) label = '99.999+';
  else if (rounded >= 99.99) label = '99.99+';
  else if (rounded >= 99.9) label = '99.9+';
  else if (rounded >= 99.5) label = '99.5+';
  else if (rounded >= 99) label = '99+';
  else if (rounded >= 95) label = '95+';
  else if (rounded >= 90) label = '90+';
  else label = `${rounded.toFixed(2)}`;
  return { value: rounded, label };
}
