/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { List, Map, OrderedSet } from 'immutable';

import { ActionURL } from '@labkey/api';

import { AppURL } from '../url/AppURL';

import { createProductUrl } from '../internal/components/navigation/utils';

import { AppRouteResolver } from './AppURLResolver';

const ADD_TABLE_ROUTE = 'application/routing/add-table-route';

type RoutingTable = Map<string, string | boolean>;

let resolvers = OrderedSet<AppRouteResolver>();

let urlMappers: List<URLMapper> = List<URLMapper>();

export interface URLMapper {
    resolve(url, row, column, schema, query): AppURL | string | boolean;
}

export namespace URLService {

    export function getUrlMappers(): List<URLMapper> {
        return urlMappers;
    }

    export function registerAppRouteResolvers(...appRouteResolvers: AppRouteResolver[]): void {
        appRouteResolvers.forEach(resolver => {
            resolvers = resolvers.add(resolver);
        });
    }

    export function resolveAppRoute(store, nextRouteState, replace, next) {
        const query = nextRouteState.location.query;
        const nextRoute = nextRouteState.location.pathname;
        const table = getRouteTable(store.getState());

        if (table.has(nextRoute)) {
            if (table.get(nextRoute) === true) {
                next();
            } else {
                replace({
                    pathname: table.get(nextRoute),
                    query,
                });
            }
        } else {
            let found = false;
            resolvers.forEach(resolver => {
                if (resolver.matches(nextRoute)) {
                    found = true;
                    const routes = nextRoute.split('/');
                    routes.shift(); // account for initial '/'
                    resolver.fetch(routes).then((fetchedRoute: AppURL | boolean) => {
                        const toRoute = typeof fetchedRoute === 'boolean' ? fetchedRoute : fetchedRoute.toString();

                        store.dispatch({
                            type: ADD_TABLE_ROUTE,
                            fromRoute: nextRoute,
                            toRoute,
                        });

                        if (typeof toRoute === 'string') {
                            replace({
                                pathname: toRoute,
                                query,
                            });
                        }

                        next();
                    });
                    return false; // stop at this resolver
                }
            });

            if (found) {
                return;
            } else {
                store.dispatch({
                    type: ADD_TABLE_ROUTE,
                    fromRoute: nextRoute,
                    toRoute: true,
                });
            }
        }

        next();
    }

    export function getRouteTable(state): RoutingTable {
        return state.routing.table;
    }

    export function registerURLMappers(...mappers: URLMapper[]): void {
        urlMappers = urlMappers.concat(mappers) as List<URLMapper>;
    }
}

// TODO: This is copied from LABKEY.ActionURL -- make public?
export function parsePathName(path: string) {
    const qMarkIdx = path.indexOf('?');
    if (qMarkIdx > -1) {
        path = path.substring(0, qMarkIdx);
    }
    const start = ActionURL.getContextPath().length;
    const end = path.lastIndexOf('/');
    let action = path.substring(end + 1);
    path = path.substring(start, end);

    let controller = null;

    const dash = action.indexOf('-');
    if (dash > 0) {
        controller = action.substring(0, dash);
        action = action.substring(dash + 1);
    } else {
        const slash = path.indexOf('/', 1);
        if (slash < 0)
            // 21945: e.g. '/admin'
            controller = path.substring(1);
        else controller = path.substring(1, slash);
        path = path.substring(slash);
    }

    const dot = action.indexOf('.');
    if (dot > 0) {
        action = action.substring(0, dot);
    }

    return {
        controller: decodeURIComponent(controller).toLowerCase(),
        action: decodeURIComponent(action).toLowerCase(),
        containerPath: decodeURI(path),
    };
}

export class ActionMapper implements URLMapper {
    controller: string;
    action: string;
    resolver: (row, column, schema, query) => AppURL | string | boolean;
    productId: string;

    constructor(
        controller: string,
        action: string,
        resolver: (row?, column?, schema?, query?) => AppURL | string | boolean,
        productId?: string
    ) {
        this.controller = controller.toLowerCase();
        this.action = action.toLowerCase();
        this.resolver = resolver;
        this.productId = productId;
    }

    getProductUrl(url: AppURL): AppURL | string {
        return createProductUrl(this.productId, undefined, url);
    }

    resolve(url, row, column, schema, query): AppURL | string | boolean {
        if (url) {
            const parsed = parsePathName(url);

            if (parsed.action === this.action && parsed.controller === this.controller) {
                const resolvedUrl = this.resolver(row, column, schema, query);
                return resolvedUrl instanceof AppURL ? this.getProductUrl(resolvedUrl) : resolvedUrl;
            }
        }
    }
}
