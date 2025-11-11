export function calculateBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Number.parseFloat(bmi.toFixed(2));
}
