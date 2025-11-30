/**
 * Schema validation functions
 */
import type {
  ValidationSchema,
  DetailedValidationResult,
  ValidationError,
  ValidationWarning
} from './types';

/**
 * Validates data against a JSON schema
 */
export function validateSchema(
  data: unknown,
  schema: ValidationSchema,
  path = ''
): DetailedValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Handle undefined/null values for optional fields
  if (data === undefined || data === null) {
    // For now, allow undefined/null values - they will be handled during sanitization
    return { isValid: true, errors, warnings };
  }

  // Type validation
  if (schema.type) {
    const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];

    // Get the actual data type, handling arrays specially
    let dataType: string = typeof data;
    if (Array.isArray(data)) {
      dataType = 'array';
    }

    const isValidType = allowedTypes.includes(dataType as string) ||
      (allowedTypes.includes('null') && data === null) ||
      (allowedTypes.includes('undefined') && data === undefined);

    if (!isValidType) {
      errors.push({
        path,
        message: `Expected ${allowedTypes.join(' or ')}, got ${dataType}`,
        value: data,
        severity: 'error'
      });
      return { isValid: false, errors, warnings };
    }
  }

  // Array validation (first check)
  if (schema.type === 'array' && Array.isArray(data)) {
    // Validate array items
    if (schema.items) {
      data.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        const itemResult = validateSchema(item, schema.items!, itemPath);
        errors.push(...itemResult.errors);
        warnings.push(...itemResult.warnings);
      });
    }

    // Check array constraints
    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      errors.push({
        path,
        message: `Array exceeds maximum length: ${schema.maxItems}`,
        value: data.length,
        severity: 'error'
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  // Object property validation
  if (schema.type === 'object' && data && typeof data === 'object' && !Array.isArray(data)) {
    // Check required properties
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in data)) {
          errors.push({
            path: `${path}.${requiredProp}`,
            message: `Missing required property: ${requiredProp}`,
            severity: 'error'
          });
        }
      }
    }

    // Validate properties
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propName in data) {
          const propPath = path ? `${path}.${propName}` : propName;
          const propResult = validateSchema(
            (data as Record<string, unknown>)[propName],
            propSchema as ValidationSchema,
            propPath
          );
          errors.push(...propResult.errors);
          warnings.push(...propResult.warnings);
        }
      }
    }

    // Check for additional properties
    if (schema.additionalProperties === false) {
      const allowedProps = new Set(Object.keys(schema.properties || {}));
      for (const prop of Object.keys(data)) {
        if (!allowedProps.has(prop)) {
          warnings.push({
            path: `${path}.${prop}`,
            message: `Unexpected property: ${prop}`,
            value: (data as Record<string, unknown>)[prop],
            suggestion: 'This property will be removed during sanitization'
          });
        }
      }
    }
  }

  // Array validation (second check for max items warning)
  if (schema.type === 'array' && Array.isArray(data)) {
    if (schema.items) {
      data.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        const itemResult = validateSchema(item, schema.items!, itemPath);
        errors.push(...itemResult.errors);
        warnings.push(...itemResult.warnings);
      });
    }

    if (schema.maxItems && data.length > schema.maxItems) {
      warnings.push({
        path,
        message: `Array exceeds maximum length of ${schema.maxItems}`,
        value: data.length,
        suggestion: `Consider reducing to ${schema.maxItems} items`
      });
    }
  }

  // String validation
  if (schema.type === 'string' && typeof data === 'string') {
    validateString(data, schema, path, errors, warnings);
  }

  // Number validation
  if (schema.type === 'number' && typeof data === 'number') {
    validateNumber(data, schema, path, errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates string values against schema constraints
 */
function validateString(
  data: string,
  schema: ValidationSchema,
  path: string,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (schema.minLength && data.length < schema.minLength) {
    errors.push({
      path,
      message: `String too short. Minimum length: ${schema.minLength}`,
      value: data.length,
      severity: 'error'
    });
  }

  if (schema.maxLength && data.length > schema.maxLength) {
    warnings.push({
      path,
      message: `String too long. Maximum length: ${schema.maxLength}`,
      value: data.length,
      suggestion: 'String will be truncated during sanitization'
    });
  }

  if (schema.pattern) {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(data)) {
      errors.push({
        path,
        message: `String does not match required pattern: ${schema.pattern}`,
        value: data,
        severity: 'error'
      });
    }
  }

  if (schema.enum && !schema.enum.includes(data)) {
    errors.push({
      path,
      message: `Invalid value. Must be one of: ${schema.enum.join(', ')}`,
      value: data,
      severity: 'error'
    });
  }

  if (schema.format === 'date-time') {
    const date = new Date(data);
    if (isNaN(date.getTime())) {
      errors.push({
        path,
        message: 'Invalid date-time format',
        value: data,
        severity: 'error'
      });
    }
  }
}

/**
 * Validates number values against schema constraints
 */
function validateNumber(
  data: number,
  schema: ValidationSchema,
  path: string,
  errors: ValidationError[]
): void {
  if (schema.minimum !== undefined && data < schema.minimum) {
    errors.push({
      path,
      message: `Number below minimum value: ${schema.minimum}`,
      value: data,
      severity: 'error'
    });
  }

  if (schema.maximum !== undefined && data > schema.maximum) {
    errors.push({
      path,
      message: `Number above maximum value: ${schema.maximum}`,
      value: data,
      severity: 'error'
    });
  }
}
