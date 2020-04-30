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
import { OrderedSet } from 'immutable';

import { AppURL } from '../url/AppURL';

import { AppRouteResolver } from './AppURLResolver';

const ADD_TABLE_ROUTE = 'application/routing/add-table-route';

type RoutingTable = Map<string, string | boolean>;

let resolvers = OrderedSet<AppRouteResolver>();

export namespace URLService {
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
}
