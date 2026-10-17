// Shared with registration so recovery does not introduce a different policy.
export const PASSWORD_REQUIREMENTS =
  "Use at least 8 characters with a letter and a number.";

export function getPasswordError(password: string): string | undefined {
  if (!password) return "Enter a password.";
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return PASSWORD_REQUIREMENTS;
  }
  return undefined;
}

export function getConfirmPasswordError(
  password: string,
  confirmation: string,
): string | undefined {
  if (!confirmation) return "Confirm your password.";
  if (confirmation !== password) return "Passwords do not match.";
  return undefined;
}
