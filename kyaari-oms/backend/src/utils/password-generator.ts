/**
 * Generate a secure random password
 * Format: 8 characters + 3 digits + 1 special char
 * Example: AbCdEfGh123!
 */
export function generateSecurePassword(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%&*';

  let password = '';

  // Add 2 uppercase letters
  for (let i = 0; i < 2; i++) {
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
  }

  // Add 4 lowercase letters
  for (let i = 0; i < 4; i++) {
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
  }

  // Add 2 more random letters (upper or lower)
  const letters = lowercase + uppercase;
  for (let i = 0; i < 2; i++) {
    password += letters[Math.floor(Math.random() * letters.length)];
  }

  // Add 3 numbers
  for (let i = 0; i < 3; i++) {
    password += numbers[Math.floor(Math.random() * numbers.length)];
  }

  // Add 1 special character
  password += special[Math.floor(Math.random() * special.length)];

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

