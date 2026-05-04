export function redactSensitiveKey(value: string): string {
  if (!value) {
    return '';
  }

  if (value.length <= 12) {
    return '••••';
  }

  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
