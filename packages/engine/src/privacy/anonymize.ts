import { createHash } from 'crypto';

/**
 * Configuration options for data anonymization
 */
export interface AnonymizeOptions {
  /** Salt to add to the hash for additional security */
  salt?: string;
  /** Hash algorithm to use (default: 'sha256') */
  algorithm?: 'sha256' | 'sha512' | 'md5';
  /** Whether to preserve the data type structure */
  preserveStructure?: boolean;
  /** Custom anonymization function for specific fields */
  customAnonymizer?: (value: any, fieldName: string) => any;
}

/**
 * Fields that should be anonymized by default for GDPR compliance
 */
const SENSITIVE_FIELDS = new Set([
  'email',
  'firstName',
  'lastName',
  'fullName',
  'name',
  'phone',
  'phoneNumber',
  'address',
  'street',
  'city',
  'zipCode',
  'postalCode',
  'ssn',
  'socialSecurityNumber',
  'dateOfBirth',
  'birthDate',
  'ip',
  'ipAddress',
  'userId',
  'playerId',
]);

/**
 * Anonymizes a single value using cryptographic hashing
 */
function anonymizeValue(
  value: any,
  options: AnonymizeOptions = {}
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const { salt = 'ump-gdpr-salt', algorithm = 'sha256' } = options;

  // Convert value to string for hashing
  const stringValue = String(value);
  const saltedValue = `${stringValue}${salt}`;

  // Create hash
  const hash = createHash(algorithm).update(saltedValue, 'utf8').digest('hex');

  // Return truncated hash for readability (first 16 characters)
  return `anon_${hash.substring(0, 16)}`;
}

/**
 * Checks if a field name indicates sensitive personal data
 */
function isSensitiveField(fieldName: string): boolean {
  const lowerFieldName = fieldName.toLowerCase();

  // Check exact matches
  if (SENSITIVE_FIELDS.has(lowerFieldName)) {
    return true;
  }

  // Check for common patterns
  const sensitivePatterns = [
    /email/i,
    /name/i,
    /phone/i,
    /address/i,
    /birth/i,
    /personal/i,
    /private/i,
    /contact/i,
    /by$/i, // Fields ending with 'by' (like createdBy, updatedBy)
  ];

  return sensitivePatterns.some((pattern) => pattern.test(fieldName));
}

/**
 * Recursively anonymizes an object, preserving structure while anonymizing sensitive fields
 */
function anonymizeObject(
  obj: Record<string, any>,
  options: AnonymizeOptions = {},
  path = '',
  visited = new WeakSet()
): Record<string, any> {
  // Handle circular references
  if (visited.has(obj)) {
    return { '[Circular Reference]': true };
  }
  visited.add(obj);

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;

    // Use custom anonymizer if provided
    if (options.customAnonymizer) {
      try {
        result[key] = options.customAnonymizer(value, currentPath);
        continue;
      } catch (error) {
        // Fall back to default anonymization if custom fails
        console.warn(
          `Custom anonymizer failed for field ${currentPath}:`,
          error
        );
      }
    }

    if (value === null || value === undefined) {
      result[key] = value;
    } else if (Array.isArray(value)) {
      // Recursively anonymize array elements
      result[key] = value.map((item, index) => {
        if (typeof item === 'object' && item !== null) {
          return anonymizeObject(
            item,
            options,
            `${currentPath}[${index}]`,
            visited
          );
        }
        return isSensitiveField(key) ? anonymizeValue(item, options) : item;
      });
    } else if (typeof value === 'object') {
      // Recursively anonymize nested objects
      result[key] = anonymizeObject(value, options, currentPath, visited);
    } else if (isSensitiveField(key)) {
      // Anonymize sensitive fields
      result[key] = anonymizeValue(value, options);
    } else {
      // Keep non-sensitive fields as-is
      result[key] = value;
    }
  }

  return result;
}

/**
 * Main anonymization function that can handle various data types
 *
 * @param data - The data to anonymize (object, array, or primitive)
 * @param options - Configuration options for anonymization
 * @returns Anonymized version of the data
 *
 * @example
 * ```typescript
 * const userData = {
 *   id: 123,
 *   email: 'user@example.com',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   score: 85
 * };
 *
 * const anonymized = anonymize(userData);
 * // Result: {
 * //   id: 123,
 * //   email: 'anon_a1b2c3d4e5f6g7h8',
 * //   firstName: 'anon_x9y8z7w6v5u4t3s2',
 * //   lastName: 'anon_m1n2o3p4q5r6s7t8',
 * //   score: 85
 * // }
 * ```
 */
export function anonymize<T = any>(data: T, options: AnonymizeOptions = {}): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    const visited = new WeakSet();
    return data.map((item, index) => {
      if (typeof item === 'object' && item !== null) {
        return anonymizeObject(item, options, `[${index}]`, visited);
      }
      return item;
    }) as T;
  }

  if (typeof data === 'object') {
    return anonymizeObject(
      data as Record<string, any>,
      options,
      '',
      new WeakSet()
    ) as T;
  }

  // For primitive values, return as-is unless specifically requested to anonymize
  return data;
}

/**
 * Creates a context-aware anonymization function for use in plugins
 * This function is designed to be injected into plugin execution contexts
 *
 * @param contextOptions - Default options for this context
 * @returns A configured anonymize function
 */
export function createAnonymizeContext(contextOptions: AnonymizeOptions = {}) {
  return {
    /**
     * Anonymize data with context-specific options
     */
    anonymize: <T = any>(data: T, options?: AnonymizeOptions): T => {
      const mergedOptions = { ...contextOptions, ...options };
      return anonymize(data, mergedOptions);
    },

    /**
     * Check if a field should be considered sensitive
     */
    isSensitiveField,

    /**
     * Anonymize a single value
     */
    anonymizeValue: (value: any, options?: AnonymizeOptions) => {
      const mergedOptions = { ...contextOptions, ...options };
      return anonymizeValue(value, mergedOptions);
    },

    /**
     * Add custom sensitive field patterns
     */
    addSensitiveFields: (fields: string[]) => {
      fields.forEach((field) => SENSITIVE_FIELDS.add(field.toLowerCase()));
    },
  };
}

/**
 * Utility function to validate GDPR compliance of data
 * Checks if an object contains potentially sensitive data that should be anonymized
 *
 * @param data - The data to validate
 * @returns Object containing validation results
 */
export function validateGDPRCompliance(data: any): {
  isCompliant: boolean;
  sensitiveFields: string[];
  recommendations: string[];
} {
  const sensitiveFields: string[] = [];
  const recommendations: string[] = [];

  function checkObject(obj: Record<string, any>, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (isSensitiveField(key)) {
        sensitiveFields.push(currentPath);

        // Check if the value looks like it might be anonymized already
        if (typeof value === 'string' && value.startsWith('anon_')) {
          // Likely already anonymized
          continue;
        }

        recommendations.push(
          `Consider anonymizing field '${currentPath}' containing: ${typeof value}`
        );
      }

      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        checkObject(value, currentPath);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            checkObject(item, `${currentPath}[${index}]`);
          }
        });
      }
    }
  }

  if (typeof data === 'object' && data !== null) {
    checkObject(data);
  }

  return {
    isCompliant: recommendations.length === 0,
    sensitiveFields,
    recommendations,
  };
}

export { SENSITIVE_FIELDS };
