import { ValidationError, Validations, Values } from './types';

function getTag(value): string {
    if (value == null) {
        return value === undefined ? '[object Undefined]' : '[object Null]';
    }
    return Object.prototype.toString.call(value);
}

function isObjectLike(value): boolean {
    return typeof value === 'object' && value !== null;
}

export function isObject(value: unknown): value is object {
    if (!isObjectLike(value) || getTag(value) !== '[object Object]') {
        return false;
    }
    if (Object.getPrototypeOf(value) === null) {
        return true;
    }
    let proto = value;
    while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto);
    }
    return Object.getPrototypeOf(value) === proto;
}

export function isDate(value: unknown): value is Date {
    return value instanceof Date;
}

export function isFunction(value: unknown): value is Function {
    return value !== null && typeof value === 'function';
}

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isRegex(value: unknown): value is RegExp {
    return value instanceof RegExp;
}

export function isValueNullOrUndefined(value: unknown): boolean {
    return value === null || value === undefined;
}

export function protectAgainstParamReassignment(value: unknown) {
    // Clone objects to avoid accidental param reassignment
    if (isObject(value)) return { ...value };
    if (Array.isArray(value)) return [...value];
    return value;
}

export function isSame(a: unknown, b: unknown): boolean {
    if (typeof a !== typeof b) {
        return false;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }

        return a.every((item, index) => isSame(item, b[index]));
    }

    if (isFunction(a) && isFunction(b)) {
        return a.toString() === b.toString();
    }

    if (isDate(a) && isDate(b)) {
        return a.toString() === b.toString();
    }

    if (isObject(a) && isObject(b)) {
        if (Object.keys(a).length !== Object.keys(b).length) {
            return false;
        }

        return Object.keys(a).every(key => isSame(a[key], b[key]));
    }

    if (isRegex(a) && isRegex(b)) {
        return a.toString() === b.toString();
    }

    return a === b;
}

interface RulesResult {
    errors: ValidationError[];
    failed: string[];
    success: string[];
}

export function runRules<V>(
    value: V,
    currentValues: Values,
    validations: Validations<V>,
    validationRules: Validations<V>
) {
    const results: RulesResult = {
        errors: [],
        failed: [],
        success: [],
    };

    Object.keys(validations).forEach(validationName => {
        const validationsVal = validations[validationName];
        const validationRulesVal = validationRules[validationName];
        const addToResults = validation => {
            if (isString(validation)) {
                results.errors.push(validation);
                results.failed.push(validationName);
            } else if (!validation) {
                results.failed.push(validationName);
            } else {
                results.success.push(validationName);
            }
        };

        if (validationRulesVal && isFunction(validationsVal)) {
            throw new Error(`Formsy does not allow you to override default validations: ${validationName}`);
        }

        if (!validationRulesVal && !isFunction(validationsVal)) {
            throw new Error(`Formsy does not have the validation rule: ${validationName}`);
        }

        if (isFunction(validationsVal)) {
            return addToResults(validationsVal(currentValues, value));
        }

        return addToResults(validationRulesVal(currentValues, value, validationsVal));
    });

    return results;
}

export function debounce(callback, timeout: number) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            callback.apply(this, args);
        }, timeout);
    };
}
