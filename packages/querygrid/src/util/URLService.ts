/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import {OrderedSet} from 'immutable'
import {AppURL} from '@glass/base'

import { AppRouteResolver } from "./AppURLResolver";

const ADD_TABLE_ROUTE = 'application/routing/add-table-route';

type RoutingTable = Map<string, string | boolean>;

let resolvers = OrderedSet<AppRouteResolver>();

export namespace URLService {
    export function registerAppRouteResolvers(...appRouteResolvers: Array<AppRouteResolver>): void {
        appRouteResolvers.forEach((resolver) => {
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
            }
            else {
                replace({
                    pathname: table.get(nextRoute),
                    query
                });
            }
        }
        else {
            let found = false;
            resolvers.forEach((resolver) => {
                if (resolver.matches(nextRoute)) {
                    found = true;
                    let routes = nextRoute.split('/');
                    routes.shift(); // account for initial '/'
                    resolver.fetch(routes)
                        .then((fetchedRoute: AppURL | boolean) => {
                            let toRoute = typeof fetchedRoute === 'boolean' ? fetchedRoute : fetchedRoute.toString();

                            store.dispatch({
                                type: ADD_TABLE_ROUTE,
                                fromRoute: nextRoute,
                                toRoute
                            });

                            if (typeof toRoute === 'string') {
                                replace({
                                    pathname: toRoute,
                                    query
                                });
                            }

                            next();
                        });
                    return false; // stop at this resolver
                }
            });

            if (found) {
                return;
            }
            else {
                store.dispatch({
                    type: ADD_TABLE_ROUTE,
                    fromRoute: nextRoute,
                    toRoute: true
                });
            }
        }

        next();
    }

    export function getRouteTable(state): RoutingTable {
        return state.routing.table;
    }
}
