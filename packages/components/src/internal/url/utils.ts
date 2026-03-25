export function decodeListResolverPath(resolverPath: string): string {
    return resolverPath.replace('$CPS', '').replace('$CPE', '');
}

export function encodeListResolverPath(containerPath: string): string {
    return ['$CPS', containerPath?.toLowerCase(), '$CPE'].join('');
}

// Issue 52925, Issue 52119, Issue 54218
export function encodeFormDataQuote(key: string): string {
    if (!key || !/[\\"%]/.test(key)) return key;
    return '%_' + encodeURIComponent(key);
}

export function getIntegerSearchParam(searchParams: URLSearchParams, paramName: string): number {
    const value = parseInt(searchParams.get(paramName), 10);
    return isNaN(value) ? undefined : value;
}
