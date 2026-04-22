import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateInvoiceNumber(tenantSlug: string, sequence: number) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const seq = String(sequence).padStart(4, "0");
  return `INV-${tenantSlug.toUpperCase()}-${date}-${seq}`;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
