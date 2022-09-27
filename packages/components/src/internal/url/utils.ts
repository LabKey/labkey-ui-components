import { AppURL } from './AppURL';

export function decodeListResolverPath(resolverPath: string): string {
    return resolverPath.replace('$CPS', '').replace('$CPE', '');
}

export function encodeListResolverPath(containerPath: string): string {
    return ['$CPS', containerPath?.toLowerCase(), '$CPE'].join('');
}

export function getHref(url: AppURL | string): string {
    return typeof url === 'string' ? url : url.toHref();
}
