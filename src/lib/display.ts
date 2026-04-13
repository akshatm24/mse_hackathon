export const fmt = {
  num: (value: number | null | undefined, unit = "", decimals = 2) =>
    value != null && Number.isFinite(value)
      ? `${value.toFixed(decimals)} ${unit}`.trim()
      : "—",
  str: (value: string | null | undefined) => value ?? "—",
  bool: (value: boolean | null | undefined) => (value == null ? "—" : value ? "Yes" : "No")
};
