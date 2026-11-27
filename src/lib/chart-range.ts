export function scoreRange(values: number[]) {
  if (!values.length) return { min: 0, max: 100, ticks: [0, 25, 50, 75, 100] };
  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const padding = Math.max((highest - lowest) * 0.15, 2);
  const rawStep = (highest - lowest + padding * 2) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 5, 10].find(value => value * magnitude >= rawStep)! * magnitude;
  const min = lowest >= 0 ? Math.max(0, Math.floor((lowest - padding) / step) * step) : Math.floor((lowest - padding) / step) * step;
  const max = Math.ceil((highest + padding) / step) * step;
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, index) => Number((min + index * step).toPrecision(12)));
  return { min, max, ticks };
}

