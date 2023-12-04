import { Location } from 'history';

// Note: this file can probably be removed once we stop using the deprecated types below, right now we need the types
// in utils/URL.ts and withRouterDeprecated which would create a circular dependency.

export type QueryParams = Record<string, string | string[]>;

export interface DeprecatedRouter {
    goBack: () => void;
    goForward: () => void;
    push: (string) => void;
    replace: (string) => void;
}

export interface DeprecatedLocation extends Location {
    // You should not be relying on this Location type, instead you should be using the Location type from the History
    // library, and you should be using something like: const queryParams = new URLSearchParams(location.search);
    query: QueryParams;
}
