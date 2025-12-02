/**
 * Data sanitization functions
 */
import type { ValidationSchema, SanitizationOptions } from './types';

/**
 * Sanitizes data based on validation results and options
 */
export function sanitizeData(
  data: unknown,
  schema: ValidationSchema,
  options: SanitizationOptions
): { sanitized: unknown; changes: string[] } {
  const changes: string[] = [];
  let sanitized = JSON.parse(JSON.stringify(data)); // Deep clone

  if (schema.type === 'object' && sanitized && typeof sanitized === 'object') {
    sanitized = sanitizeObject(sanitized, schema, options, changes);
  }

  // String sanitization
  if (schema.type === 'string' && typeof sanitized === 'string') {
    sanitized = sanitizeString(sanitized, schema, options, changes);
  }

  // Array sanitization
  if (schema.type === 'array' && Array.isArray(sanitized)) {
    sanitized = sanitizeArray(sanitized, schema, options, changes);
  }

  return { sanitized, changes };
}

/**
 * Sanitizes object values
 */
function sanitizeObject(
  sanitized: Record<string, unknown>,
  schema: ValidationSchema,
  options: SanitizationOptions,
  changes: string[]
): Record<string, unknown> {
  // Remove invalid fields
  if (options.removeInvalidFields && schema.additionalProperties === false) {
    const allowedProps = new Set(Object.keys(schema.properties || {}));
    for (const prop of Object.keys(sanitized)) {
      if (!allowedProps.has(prop)) {
        delete sanitized[prop];
        changes.push(`Removed invalid property: ${prop}`);
      }
    }
  }

  // Set default values for missing required fields
  if (options.setDefaultValues && schema.required && schema.properties) {
    for (const requiredProp of schema.required) {
      if (!(requiredProp in sanitized)) {
        const propSchema = schema.properties[requiredProp] as ValidationSchema;
        sanitized[requiredProp] = getDefaultValue(propSchema);
        changes.push(`Set default value for missing property: ${requiredProp}`);
      }
    }
  }

  // Sanitize properties
  if (schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (propName in sanitized) {
        const result = sanitizeData(sanitized[propName], propSchema as ValidationSchema, options);
        sanitized[propName] = result.sanitized;
        changes.push(...result.changes.map(change => `${propName}.${change}`));
      }
    }
  }

  return sanitized;
}

/**
 * Sanitizes string values
 */
function sanitizeString(
  value: string,
  schema: ValidationSchema,
  options: SanitizationOptions,
  changes: string[]
): string {
  let sanitized = value;

  if (options.normalizeStrings) {
    const normalized = sanitized.trim();
    if (normalized !== sanitized) {
      sanitized = normalized;
      changes.push('Normalized string (trimmed whitespace)');
    }
  }

  if (schema.maxLength && sanitized.length > schema.maxLength) {
    sanitized = sanitized.substring(0, schema.maxLength);
    changes.push(`Truncated string to ${schema.maxLength} characters`);
  }

  return sanitized;
}

/**
 * Sanitizes array values
 */
function sanitizeArray(
  value: unknown[],
  schema: ValidationSchema,
  options: SanitizationOptions,
  changes: string[]
): unknown[] {
  let sanitized = value;

  if (schema.maxItems && sanitized.length > schema.maxItems) {
    sanitized = sanitized.slice(0, schema.maxItems);
    changes.push(`Truncated array to ${schema.maxItems} items`);
  }

  if (schema.items) {
    sanitized = sanitized.map((item: unknown, index: number) => {
      const result = sanitizeData(item, schema.items!, options);
      if (result.changes.length > 0) {
        changes.push(...result.changes.map(change => `[${index}].${change}`));
      }
      return result.sanitized;
    });
  }

  return sanitized;
}

/**
 * Gets default value for a schema type
 */
export function getDefaultValue(schema: ValidationSchema): unknown {
  switch (schema.type) {
    case 'string':
      if (schema.enum) return schema.enum[0];
      if (schema.format === 'date-time') return new Date().toISOString();
      return '';
    case 'number':
      return schema.minimum || 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return null;
  }
}
