export function formatCop(value: number | null): string {
  if (value === null) {
    return "Precio por confirmar";
  }

  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError("The COP value must be a finite non-negative number.");
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
