import { AppURL } from './AppURL';

export interface AppRouteResolver {
    cacheName?: string;
    clearCache?: () => void;
    fetch: (parts: any[]) => Promise<AppURL | boolean>;
    matches: (route: string) => boolean;
}
