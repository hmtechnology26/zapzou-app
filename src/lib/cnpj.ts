export function normalizeCnpj(value?: string | null) {
  return (value || '').replace(/\D/g, '').slice(0, 14);
}

export function formatCnpj(value?: string | null) {
  const digits = normalizeCnpj(value);
  if (!digits) return '';

  const part1 = digits.slice(0, 2);
  const part2 = digits.slice(2, 5);
  const part3 = digits.slice(5, 8);
  const part4 = digits.slice(8, 12);
  const part5 = digits.slice(12, 14);

  let formatted = part1;
  if (digits.length > 2) formatted += `.${part2}`;
  if (digits.length > 5) formatted += `.${part3}`;
  if (digits.length > 8) formatted += `/${part4}`;
  if (digits.length > 12) formatted += `-${part5}`;

  return formatted;
}

export function hasCnpj(value?: string | null) {
  return normalizeCnpj(value).length > 0;
}
