import { AppURL } from './AppURL';

export interface AppRouteResolver {
    cacheName?: string;
    clearCache?: () => void;
    fetch: (parts: string[]) => Promise<AppURL>;
    matches: (route: string) => boolean;
}
