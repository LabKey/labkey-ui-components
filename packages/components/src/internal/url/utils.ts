export function decodeListResolverPath(resolverPath: string): string {
    return resolverPath.replace('$CPS', '').replace('$CPE', '');
}

export function encodeListResolverPath(containerPath: string): string {
    return ['$CPS', containerPath?.toLowerCase(), '$CPE'].join('');
}

export function getIntegerSearchParam(searchParams: URLSearchParams, paramName: string): number {
    const value = parseInt(searchParams.get(paramName), 10);
    return isNaN(value) ? undefined : value;
}
