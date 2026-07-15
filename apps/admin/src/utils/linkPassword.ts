interface PasswordUpdateInput {
  existingPasswordProtected: boolean;
  password: string;
  passwordTouched: boolean;
  clearPassword: boolean;
}

export function resolvePasswordUpdate({
  existingPasswordProtected,
  password,
  passwordTouched,
  clearPassword,
}: PasswordUpdateInput): string | null | undefined {
  if (clearPassword) return null;

  const normalized = password.trim();
  if (normalized) return normalized;
  if (existingPasswordProtected && passwordTouched) return null;
  return undefined;
}
