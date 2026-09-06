export interface InputValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

export const ValidationPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  username: /^[a-zA-Z0-9_]{3,30}$/,
  password: /^.{6,100}$/,
  phone: /^[\d\s\-+()]{7,20}$/,
  amount: /^\d+(\.\d{1,2})?$/,
  positiveInteger: /^\d+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  safeString: /^[a-zA-Z0-9\s\-_.@!?#$%&*()+=,;:'"]+$/,
};

export const ValidationLimits = {
  username: { min: 3, max: 30 },
  password: { min: 6, max: 100 },
  email: { min: 5, max: 254 },
  phone: { min: 7, max: 20 },
  amount: { min: 1, max: 100000 },
  voucherCode: { min: 4, max: 50 },
  message: { min: 1, max: 1000 },
};

export function trimInput(input: string): string {
  return input.trim();
}


export function validateEmail(email: string): InputValidationResult {
  const sanitized = trimInput(email).toLowerCase();
  
  if (!sanitized) {
    return { valid: false, error: "Email is required" };
  }
  
  if (sanitized.length < ValidationLimits.email.min) {
    return { valid: false, error: "Email is too short" };
  }
  
  if (sanitized.length > ValidationLimits.email.max) {
    return { valid: false, error: "Email is too long" };
  }
  
  if (!ValidationPatterns.email.test(sanitized)) {
    return { valid: false, error: "Please enter a valid email address" };
  }
  
  return { valid: true, sanitized };
}

export function validateUsername(username: string): InputValidationResult {
  const sanitized = trimInput(username);
  
  if (!sanitized) {
    return { valid: false, error: "Username is required" };
  }
  
  if (sanitized.length < ValidationLimits.username.min) {
    return { valid: false, error: `Username must be at least ${ValidationLimits.username.min} characters` };
  }
  
  if (sanitized.length > ValidationLimits.username.max) {
    return { valid: false, error: `Username must be less than ${ValidationLimits.username.max} characters` };
  }
  
  if (!ValidationPatterns.username.test(sanitized)) {
    return { valid: false, error: "Username can only contain letters, numbers, and underscores" };
  }
  
  return { valid: true, sanitized };
}

export function validatePassword(password: string): InputValidationResult {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }
  
  if (password.length < ValidationLimits.password.min) {
    return { valid: false, error: `Password must be at least ${ValidationLimits.password.min} characters` };
  }
  
  if (password.length > ValidationLimits.password.max) {
    return { valid: false, error: `Password is too long` };
  }
  
  return { valid: true, sanitized: password };
}

export function validatePasswordStrength(password: string): {
  valid: boolean;
  strength: "weak" | "medium" | "strong";
  suggestions: string[];
} {
  const suggestions: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score++;
  else suggestions.push("Use at least 8 characters");
  
  if (/[a-z]/.test(password)) score++;
  else suggestions.push("Add lowercase letters");
  
  if (/[A-Z]/.test(password)) score++;
  else suggestions.push("Add uppercase letters");
  
  if (/\d/.test(password)) score++;
  else suggestions.push("Add numbers");
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else suggestions.push("Add special characters");
  
  let strength: "weak" | "medium" | "strong" = "weak";
  if (score >= 4) strength = "strong";
  else if (score >= 3) strength = "medium";
  
  return {
    valid: score >= 3,
    strength,
    suggestions,
  };
}

export function validatePhone(phone: string): InputValidationResult {
  const sanitized = trimInput(phone).replace(/\s+/g, "");
  
  if (!sanitized) {
    return { valid: false, error: "Phone number is required" };
  }
  
  const digitsOnly = sanitized.replace(/\D/g, "");
  
  if (digitsOnly.length < ValidationLimits.phone.min) {
    return { valid: false, error: "Phone number is too short" };
  }
  
  if (digitsOnly.length > ValidationLimits.phone.max) {
    return { valid: false, error: "Phone number is too long" };
  }
  
  return { valid: true, sanitized };
}

export function validateAmount(amount: string | number): InputValidationResult & { numericValue?: number } {
  const stringValue = String(amount).trim();
  
  if (!stringValue) {
    return { valid: false, error: "Amount is required" };
  }
  
  const numericValue = parseFloat(stringValue.replace(/[,$]/g, ""));
  
  if (isNaN(numericValue)) {
    return { valid: false, error: "Please enter a valid amount" };
  }
  
  if (numericValue < ValidationLimits.amount.min) {
    return { valid: false, error: `Minimum amount is $${ValidationLimits.amount.min}` };
  }
  
  if (numericValue > ValidationLimits.amount.max) {
    return { valid: false, error: `Maximum amount is $${ValidationLimits.amount.max.toLocaleString()}` };
  }
  
  return { 
    valid: true, 
    sanitized: numericValue.toFixed(2),
    numericValue 
  };
}

export function validateVoucherCode(code: string): InputValidationResult {
  const sanitized = trimInput(code).toUpperCase().replace(/\s+/g, "");
  
  if (!sanitized) {
    return { valid: false, error: "Voucher code is required" };
  }
  
  if (sanitized.length < ValidationLimits.voucherCode.min) {
    return { valid: false, error: "Voucher code is too short" };
  }
  
  if (sanitized.length > ValidationLimits.voucherCode.max) {
    return { valid: false, error: "Voucher code is too long" };
  }
  
  if (!ValidationPatterns.alphanumeric.test(sanitized)) {
    return { valid: false, error: "Voucher code can only contain letters and numbers" };
  }
  
  return { valid: true, sanitized };
}

export function validatePaypalEmail(email: string): InputValidationResult {
  const emailResult = validateEmail(email);
  
  if (!emailResult.valid) {
    return emailResult;
  }
  
  return { 
    valid: true, 
    sanitized: emailResult.sanitized 
  };
}

export function validateCashAppTag(tag: string): InputValidationResult {
  const sanitized = trimInput(tag);
  
  if (!sanitized) {
    return { valid: false, error: "CashApp tag is required" };
  }
  
  const normalizedTag = sanitized.startsWith("$") ? sanitized : `$${sanitized}`;
  
  if (normalizedTag.length < 2 || normalizedTag.length > 21) {
    return { valid: false, error: "CashApp tag must be between 1 and 20 characters" };
  }
  
  if (!/^\$[a-zA-Z][a-zA-Z0-9_]*$/.test(normalizedTag)) {
    return { valid: false, error: "Invalid CashApp tag format" };
  }
  
  return { valid: true, sanitized: normalizedTag };
}

export function validateGameName(name: string): InputValidationResult {
  const sanitized = trimInput(name);
  
  if (!sanitized) {
    return { valid: false, error: "Game name is required" };
  }
  
  if (sanitized.length < 1 || sanitized.length > 100) {
    return { valid: false, error: "Invalid game name" };
  }
  
  return { valid: true, sanitized };
}

export function validateLoginCredentials(
  username: string,
  password: string
): { valid: boolean; errors: { username?: string; password?: string } } {
  const errors: { username?: string; password?: string } = {};
  
  const usernameResult = validateUsername(username);
  if (!usernameResult.valid) {
    errors.username = usernameResult.error;
  }
  
  const passwordResult = validatePassword(password);
  if (!passwordResult.valid) {
    errors.password = passwordResult.error;
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePasswordChange(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): { valid: boolean; errors: { current?: string; new?: string; confirm?: string } } {
  const errors: { current?: string; new?: string; confirm?: string } = {};
  
  const currentResult = validatePassword(currentPassword);
  if (!currentResult.valid) {
    errors.current = currentResult.error;
  }
  
  const newResult = validatePassword(newPassword);
  if (!newResult.valid) {
    errors.new = newResult.error;
  }
  
  if (newPassword !== confirmPassword) {
    errors.confirm = "Passwords do not match";
  }
  
  if (currentPassword === newPassword) {
    errors.new = "New password must be different from current password";
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function formatCurrency(amount: number | string): string {
  const numericValue = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numericValue)) return "$0.00";
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

export function parseAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
