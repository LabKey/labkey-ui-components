export function decodeListResolverPath(resolverPath: string): string {
    return resolverPath.replace('$CPS', '').replace('$CPE', '');
}

export function encodeListResolverPath(containerPath: string): string {
    return ['$CPS', containerPath?.toLowerCase(), '$CPE'].join('');
}

export function encodeFormDataQuote(key: string): string {
    if (!key)
        return key;
    return key?.replaceAll('%22', '%2522').replaceAll('"', '%22');
}
