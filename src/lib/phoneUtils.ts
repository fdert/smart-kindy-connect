/**
 * Utility functions for phone number formatting and validation
 */

/**
 * Formats a phone number to include the Saudi Arabia country code (+966)
 * @param phoneNumber - The input phone number
 * @returns Formatted phone number with +966 prefix
 */
export function formatSaudiPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // If already starts with 966, add + and return
  if (digitsOnly.startsWith('966')) {
    return `+${digitsOnly}`;
  }
  
  // If starts with 05, replace with +9665
  if (digitsOnly.startsWith('05')) {
    return `+966${digitsOnly.substring(1)}`;
  }
  
  // If starts with 5 and is 9 digits, add +966
  if (digitsOnly.startsWith('5') && digitsOnly.length === 9) {
    return `+966${digitsOnly}`;
  }
  
  // If it's 9 digits starting with 5, add +966
  if (digitsOnly.length === 9 && digitsOnly.startsWith('5')) {
    return `+966${digitsOnly}`;
  }
  
  // If it's 10 digits starting with 05, replace 0 with +966
  if (digitsOnly.length === 10 && digitsOnly.startsWith('05')) {
    return `+966${digitsOnly.substring(1)}`;
  }
  
  // Default: add +966 if the number looks like a Saudi mobile number
  if (digitsOnly.length >= 9 && digitsOnly.startsWith('5')) {
    return `+966${digitsOnly}`;
  }
  
  // If nothing matches, return as is with + if it doesn't start with it
  return digitsOnly.startsWith('966') ? `+${digitsOnly}` : `+966${digitsOnly}`;
}

/**
 * Formats phone number for display (removes +966 prefix for local display)
 * @param phoneNumber - The phone number with +966 prefix
 * @returns Phone number formatted for local display (05xxxxxxxx)
 */
export function displaySaudiPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // If starts with 966, convert to 05 format
  if (digitsOnly.startsWith('966')) {
    const localNumber = digitsOnly.substring(3);
    return `0${localNumber}`;
  }
  
  // If it's already in 05 format, return as is
  if (digitsOnly.startsWith('05')) {
    return digitsOnly;
  }
  
  // If starts with 5, add 0
  if (digitsOnly.startsWith('5') && digitsOnly.length === 9) {
    return `0${digitsOnly}`;
  }
  
  return phoneNumber;
}

/**
 * Validates if a phone number is a valid Saudi mobile number
 * @param phoneNumber - The phone number to validate
 * @returns True if valid Saudi mobile number
 */
export function isValidSaudiPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber) return false;
  
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid Saudi mobile number (should be 9 digits after 966)
  if (digitsOnly.startsWith('966')) {
    const localPart = digitsOnly.substring(3);
    return localPart.length === 9 && localPart.startsWith('5');
  }
  
  // Check if it's in local format (10 digits starting with 05)
  if (digitsOnly.startsWith('05')) {
    return digitsOnly.length === 10;
  }
  
  // Check if it's 9 digits starting with 5
  if (digitsOnly.startsWith('5')) {
    return digitsOnly.length === 9;
  }
  
  return false;
}