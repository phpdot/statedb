import type { SchemaDefinition, SchemaOptions, SchemaType } from './types';

export class Schema {
  definition: SchemaDefinition;
  capped: boolean;
  max: number;

  constructor(definition: SchemaDefinition, options: SchemaOptions = {}) {
    this.definition = definition || {};
    this.capped = options.capped || false;
    this.max = options.max || Infinity;
  }

  process(doc: Record<string, unknown>, isUpdate = false): Record<string, unknown> {
    const result = { ...doc };

    for (const [field, rules] of Object.entries(this.definition)) {
      if (!isUpdate && result[field] === undefined && rules.default !== undefined) {
        result[field] = typeof rules.default === 'function'
          ? (rules.default as () => unknown)()
          : rules.default;
      }
    }

    return result;
  }

  validate(doc: Record<string, unknown>, isUpdate = false): boolean {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(this.definition)) {
      const value = doc[field];

      if (rules.required && !isUpdate) {
        if (value === undefined || value === null) {
          errors.push(`${field} is required`);
          continue;
        }
      }

      if (value === undefined) continue;

      if (rules.type !== undefined) {
        if (!this.checkType(value, rules.type)) {
          errors.push(`${field} must be of type ${this.getTypeName(rules.type)}`);
          continue;
        }
      }

      if (typeof value === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push(`${field} must be at most ${rules.maxLength} characters`);
        }
        if (rules.match !== undefined && !rules.match.test(value)) {
          errors.push(`${field} does not match required pattern`);
        }
      }

      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} must be at most ${rules.max}`);
        }
      }

      if (rules.enum !== undefined) {
        if (!rules.enum.includes(value)) {
          errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
        }
      }

      if (Array.isArray(value) && rules.of !== undefined) {
        for (let i = 0; i < value.length; i++) {
          if (!this.checkType(value[i], rules.of)) {
            errors.push(`${field}[${i}] must be of type ${this.getTypeName(rules.of)}`);
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation error: ${errors.join('; ')}`);
    }

    return true;
  }

  checkType(value: unknown, type: SchemaType): boolean {
    if (type === String) return typeof value === 'string';
    if (type === Number) return typeof value === 'number' && !isNaN(value as number);
    if (type === Boolean) return typeof value === 'boolean';
    if (type === Date) return value instanceof Date;
    if (type === Array) return Array.isArray(value);
    if (type === Object)
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    return false;
  }

  getTypeName(type: SchemaType): string {
    if (type === String) return 'String';
    if (type === Number) return 'Number';
    if (type === Boolean) return 'Boolean';
    if (type === Date) return 'Date';
    if (type === Array) return 'Array';
    if (type === Object) return 'Object';
    return 'unknown';
  }
}
