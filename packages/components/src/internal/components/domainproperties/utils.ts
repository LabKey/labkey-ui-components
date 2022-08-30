import { DOMAIN_FIELD_PREFIX } from './constants';

export function createFormInputName(name: string): string {
    return [DOMAIN_FIELD_PREFIX, name].join('-');
}

// TODO we should rename this to include the word "domain" in the name since it is exported from the package
export function createFormInputId(name: string, domainIndex: number, rowIndex: number): string {
    return [DOMAIN_FIELD_PREFIX, name, domainIndex, rowIndex].join('-');
}

export function getNameFromId(id: string): string {
    const parts = id.split('-');
    if (parts.length === 4) {
        return parts[1];
    }

    return undefined;
}

export function getIndexFromId(id: string): number {
    const parts = id.split('-');
    if (parts.length === 4) {
        return parseInt(parts[3]);
    }

    return -1;
}
