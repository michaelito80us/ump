import {
  anonymize,
  createAnonymizeContext,
  validateGDPRCompliance,
  SENSITIVE_FIELDS,
} from '../privacy/anonymize';

describe('anonymize', () => {
  describe('basic functionality', () => {
    it('should return null for null input', () => {
      expect(anonymize(null)).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      expect(anonymize(undefined)).toBeUndefined();
    });

    it('should return primitive values unchanged', () => {
      expect(anonymize(42)).toBe(42);
      expect(anonymize('non-sensitive')).toBe('non-sensitive');
      expect(anonymize(true)).toBe(true);
    });

    it('should anonymize objects with sensitive fields', () => {
      const input = {
        id: 123,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        score: 85,
        metadata: {
          created: '2023-01-01',
          ip: '192.168.1.1',
        },
      };

      const result = anonymize(input);

      expect(result.id).toBe(123); // Non-sensitive field preserved
      expect(result.score).toBe(85); // Non-sensitive field preserved
      expect(result.metadata.created).toBe('2023-01-01'); // Non-sensitive field preserved

      expect(result.email).toMatch(/^anon_[a-f0-9]{16}$/); // Sensitive field anonymized
      expect(result.firstName).toMatch(/^anon_[a-f0-9]{16}$/); // Sensitive field anonymized
      expect(result.lastName).toMatch(/^anon_[a-f0-9]{16}$/); // Sensitive field anonymized
      expect(result.metadata.ip).toMatch(/^anon_[a-f0-9]{16}$/); // Sensitive field anonymized
    });

    it('should handle arrays of objects', () => {
      const input = [
        { id: 1, email: 'user1@example.com', score: 100 },
        { id: 2, email: 'user2@example.com', score: 95 },
      ];

      const result = anonymize(input);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].score).toBe(100);
      expect(result[0].email).toMatch(/^anon_[a-f0-9]{16}$/);
      expect(result[1].id).toBe(2);
      expect(result[1].score).toBe(95);
      expect(result[1].email).toMatch(/^anon_[a-f0-9]{16}$/);
    });

    it('should handle nested objects and arrays', () => {
      const input = {
        tournament: {
          id: 'tournament-123',
          players: [
            { id: 1, name: 'Player One', email: 'player1@example.com' },
            { id: 2, name: 'Player Two', email: 'player2@example.com' },
          ],
        },
        metadata: {
          created: '2023-01-01',
          createdBy: 'Admin User',
        },
      };

      const result = anonymize(input);

      expect(result.tournament.id).toBe('tournament-123');
      expect(result.metadata.created).toBe('2023-01-01');
      expect(result.tournament.players[0].id).toBe(1);
      expect(result.tournament.players[0].name).toMatch(/^anon_[a-f0-9]{16}$/);
      expect(result.tournament.players[0].email).toMatch(/^anon_[a-f0-9]{16}$/);
      expect(result.metadata.createdBy).toMatch(/^anon_[a-f0-9]{16}$/);
    });
  });

  describe('options', () => {
    it('should use custom salt', () => {
      const input = { email: 'test@example.com' };
      const result1 = anonymize(input, { salt: 'salt1' });
      const result2 = anonymize(input, { salt: 'salt2' });

      expect(result1.email).not.toBe(result2.email);
      expect(result1.email).toMatch(/^anon_[a-f0-9]{16}$/);
      expect(result2.email).toMatch(/^anon_[a-f0-9]{16}$/);
    });

    it('should use different hash algorithms', () => {
      const input = { email: 'test@example.com' };
      const result1 = anonymize(input, { algorithm: 'sha256' });
      const result2 = anonymize(input, { algorithm: 'sha512' });
      const result3 = anonymize(input, { algorithm: 'md5' });

      expect(result1.email).toMatch(/^anon_[a-f0-9]{16}$/);
      expect(result2.email).toMatch(/^anon_[a-f0-9]{16}$/);
      expect(result3.email).toMatch(/^anon_[a-f0-9]{16}$/);

      // Different algorithms should produce different results
      expect(result1.email).not.toBe(result2.email);
      expect(result1.email).not.toBe(result3.email);
      expect(result2.email).not.toBe(result3.email);
    });

    it('should use custom anonymizer function', () => {
      const input = {
        email: 'test@example.com',
        firstName: 'John',
        score: 100,
      };

      const customAnonymizer = jest.fn((value: any, fieldName: string) => {
        if (fieldName === 'email') {
          return 'custom_email_anonymized';
        }
        if (fieldName === 'firstName') {
          return 'custom_name_anonymized';
        }
        return value;
      });

      const result = anonymize(input, { customAnonymizer });

      expect(result.email).toBe('custom_email_anonymized');
      expect(result.firstName).toBe('custom_name_anonymized');
      expect(result.score).toBe(100);
      expect(customAnonymizer).toHaveBeenCalledWith(
        'test@example.com',
        'email'
      );
      expect(customAnonymizer).toHaveBeenCalledWith('John', 'firstName');
      expect(customAnonymizer).toHaveBeenCalledWith(100, 'score');
    });

    it('should fall back to default anonymization if custom anonymizer throws', () => {
      const input = { email: 'test@example.com' };
      const customAnonymizer = jest.fn(() => {
        throw new Error('Custom anonymizer failed');
      });

      // Mock console.warn to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = anonymize(input, { customAnonymizer });

      expect(result.email).toMatch(/^anon_[a-f0-9]{16}$/);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Custom anonymizer failed for field email:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('consistent hashing', () => {
    it('should produce consistent results for the same input', () => {
      const input = { email: 'test@example.com' };
      const result1 = anonymize(input);
      const result2 = anonymize(input);

      expect(result1.email).toBe(result2.email);
    });

    it('should produce different results for different inputs', () => {
      const input1 = { email: 'test1@example.com' };
      const input2 = { email: 'test2@example.com' };
      const result1 = anonymize(input1);
      const result2 = anonymize(input2);

      expect(result1.email).not.toBe(result2.email);
    });
  });
});

describe('createAnonymizeContext', () => {
  it('should create a context with anonymize function', () => {
    const context = createAnonymizeContext();

    expect(typeof context.anonymize).toBe('function');
    expect(typeof context.isSensitiveField).toBe('function');
    expect(typeof context.anonymizeValue).toBe('function');
    expect(typeof context.addSensitiveFields).toBe('function');
  });

  it('should use context options as defaults', () => {
    const contextOptions = { salt: 'context-salt' };
    const context = createAnonymizeContext(contextOptions);

    const input = { email: 'test@example.com' };
    const result1 = context.anonymize(input);
    const result2 = anonymize(input, contextOptions);

    expect(result1.email).toBe(result2.email);
  });

  it('should allow overriding context options', () => {
    const contextOptions = { salt: 'context-salt' };
    const context = createAnonymizeContext(contextOptions);

    const input = { email: 'test@example.com' };
    const result1 = context.anonymize(input);
    const result2 = context.anonymize(input, { salt: 'override-salt' });

    expect(result1.email).not.toBe(result2.email);
  });

  it('should allow adding sensitive fields', () => {
    const context = createAnonymizeContext();

    expect(context.isSensitiveField('customField')).toBe(false);

    context.addSensitiveFields(['customField']);

    expect(context.isSensitiveField('customField')).toBe(true);
  });

  it('should anonymize single values', () => {
    const context = createAnonymizeContext();

    const result = context.anonymizeValue('sensitive-data');

    expect(result).toMatch(/^anon_[a-f0-9]{16}$/);
  });
});

describe('validateGDPRCompliance', () => {
  it('should validate compliant data', () => {
    const data = {
      id: 123,
      score: 85,
      email: 'anon_a1b2c3d4e5f6g7h8', // Already anonymized
      firstName: 'anon_x9y8z7w6v5u4t3s2', // Already anonymized
    };

    const result = validateGDPRCompliance(data);

    expect(result.isCompliant).toBe(true);
    expect(result.sensitiveFields).toEqual(['email', 'firstName']);
    expect(result.recommendations).toHaveLength(0);
  });

  it('should identify non-compliant data', () => {
    const data = {
      id: 123,
      email: 'user@example.com', // Not anonymized
      firstName: 'John', // Not anonymized
      score: 85,
    };

    const result = validateGDPRCompliance(data);

    expect(result.isCompliant).toBe(false);
    expect(result.sensitiveFields).toEqual(['email', 'firstName']);
    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations[0]).toContain('email');
    expect(result.recommendations[1]).toContain('firstName');
  });

  it('should handle nested objects', () => {
    const data = {
      user: {
        profile: {
          email: 'user@example.com',
          personalInfo: {
            firstName: 'John',
          },
        },
      },
      metadata: {
        created: '2023-01-01',
      },
    };

    const result = validateGDPRCompliance(data);

    expect(result.isCompliant).toBe(false);
    expect(result.sensitiveFields).toContain('user.profile.email');
    expect(result.sensitiveFields).toContain(
      'user.profile.personalInfo.firstName'
    );
  });

  it('should handle arrays', () => {
    const data = {
      users: [
        { id: 1, email: 'user1@example.com' },
        { id: 2, email: 'user2@example.com' },
      ],
    };

    const result = validateGDPRCompliance(data);

    expect(result.isCompliant).toBe(false);
    expect(result.sensitiveFields).toContain('users[0].email');
    expect(result.sensitiveFields).toContain('users[1].email');
  });

  it('should return compliant for non-object data', () => {
    expect(validateGDPRCompliance(null).isCompliant).toBe(true);
    expect(validateGDPRCompliance(undefined).isCompliant).toBe(true);
    expect(validateGDPRCompliance(42).isCompliant).toBe(true);
    expect(validateGDPRCompliance('string').isCompliant).toBe(true);
  });
});

describe('SENSITIVE_FIELDS', () => {
  it('should contain expected sensitive field names', () => {
    const expectedFields = [
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
    ];

    expectedFields.forEach((field) => {
      expect(SENSITIVE_FIELDS.has(field)).toBe(true);
    });
  });

  it('should be a Set', () => {
    expect(SENSITIVE_FIELDS).toBeInstanceOf(Set);
  });
});

describe('edge cases', () => {
  it('should handle circular references gracefully', () => {
    const obj: any = { id: 1, email: 'test@example.com' };
    obj.self = obj; // Create circular reference

    // This should not throw an error, but may not handle the circular reference perfectly
    // The important thing is that it doesn't crash
    expect(() => anonymize(obj)).not.toThrow();
  });

  it('should handle very large objects', () => {
    const largeObj: any = {};
    for (let i = 0; i < 1000; i++) {
      largeObj[`field${i}`] =
        i % 10 === 0 ? `email${i}@example.com` : `value${i}`;
    }

    const result = anonymize(largeObj);

    expect(typeof result).toBe('object');
    expect(Object.keys(result)).toHaveLength(1000);
  });

  it('should handle special characters in field names', () => {
    const input = {
      'user-email': 'test@example.com',
      user_name: 'John Doe',
      'user.firstName': 'Jane',
    };

    const result = anonymize(input);

    // Fields with 'email' and 'name' patterns should be anonymized
    expect(result['user-email']).toMatch(/^anon_[a-f0-9]{16}$/);
    expect(result['user_name']).toMatch(/^anon_[a-f0-9]{16}$/);
    expect(result['user.firstName']).toMatch(/^anon_[a-f0-9]{16}$/);
  });
});
