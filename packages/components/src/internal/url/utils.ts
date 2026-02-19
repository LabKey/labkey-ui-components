export function decodeListResolverPath(resolverPath: string): string {
    return resolverPath.replace('$CPS', '').replace('$CPE', '');
}

export function encodeListResolverPath(containerPath: string): string {
    return ['$CPS', containerPath?.toLowerCase(), '$CPE'].join('');
}

// Issue 52925, 52119
export function encodeFormDataQuote(key: string): string {
    if (!key)
        return key;
    // need to replace %22, before replacing " to %22
    return key?.replaceAll('%22', '%2522').replaceAll('"', '%22');
}

export function getIntegerSearchParam(searchParams: URLSearchParams, paramName: string): number {
    const value = parseInt(searchParams.get(paramName), 10);
    return isNaN(value) ? undefined : value;
}
