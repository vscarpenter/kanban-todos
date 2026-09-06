import type { ToolInput } from './types';

/**
 * Input checks for tool handlers. The JSON Schema on each tool tells agents
 * what to send; these checks are what actually protects the store. Every
 * failure throws a plain Error whose message names the field, and the
 * browser hands that message to the agent.
 */

export function asInput(value: unknown): ToolInput {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return value as ToolInput;
}

export function optionalString(input: ToolInput, key: string): string | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new Error(`${key} must be a string`);
  return value;
}

/** Like optionalString, but null is allowed and means "clear the field". */
export function nullableString(input: ToolInput, key: string): string | null | undefined {
  if (input[key] === null) return null;
  return optionalString(input, key);
}

export function requireString(input: ToolInput, key: string): string {
  const value = optionalString(input, key);
  if (value === undefined || value.trim() === '') {
    throw new Error(`${key} is required and must be a non-empty string`);
  }
  return value;
}

export function optionalEnum<T extends string>(
  input: ToolInput,
  key: string,
  allowed: readonly T[]
): T | undefined {
  const value = optionalString(input, key);
  if (value === undefined) return undefined;
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(`${key} must be one of: ${allowed.join(', ')}`);
  }
  return value as T;
}

export function requireEnum<T extends string>(input: ToolInput, key: string, allowed: readonly T[]): T {
  const value = optionalEnum(input, key, allowed);
  if (value === undefined) throw new Error(`${key} is required and must be one of: ${allowed.join(', ')}`);
  return value;
}

export function optionalBoolean(input: ToolInput, key: string): boolean | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') throw new Error(`${key} must be true or false`);
  return value;
}

export function optionalInteger(
  input: ToolInput,
  key: string,
  range: { min: number; max: number }
): number | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isInteger(value)) throw new Error(`${key} must be an integer`);
  if (value < range.min || value > range.max) {
    throw new Error(`${key} must be between ${range.min} and ${range.max}`);
  }
  return value;
}

export function optionalStringArray(input: ToolInput, key: string): string[] | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${key} must be an array of strings`);
  }
  return value;
}

/** Accepts an ISO 8601 date or date-time string. null means "clear the date". */
export function nullableDate(input: ToolInput, key: string): Date | null | undefined {
  const value = nullableString(input, key);
  if (value === undefined || value === null) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${key} must be an ISO 8601 date such as 2026-09-05 or 2026-09-05T17:00:00Z`);
  }
  return date;
}
