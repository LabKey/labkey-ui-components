import { AppURL } from './AppURL';

export interface AppRouteResolver {
    matches: (route: string) => boolean;
    fetch: (parts: any[]) => Promise<AppURL | boolean>;
    cacheName?: string;
    clearCache?: () => void;
}
