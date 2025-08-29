/**
 * Privacy utilities for GDPR compliance and data anonymization
 *
 * This module provides tools for anonymizing personal data in compliance with GDPR requirements.
 * It includes utilities for detecting sensitive fields and anonymizing data while preserving
 * structure and functionality.
 */

export {
  anonymize,
  createAnonymizeContext,
  validateGDPRCompliance,
  SENSITIVE_FIELDS,
  type AnonymizeOptions,
} from './anonymize';
