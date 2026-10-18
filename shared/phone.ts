export function normalizeKenyanMpesaPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const national = digits.startsWith("254")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;

  return /^[17]\d{8}$/.test(national) ? `254${national}` : null;
}
