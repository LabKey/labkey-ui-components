/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { isValidElement, Key } from 'react';
import { Ajax } from '@labkey/api';
import type { DataRouter } from 'react-router';

type RouterState = DataRouter['state'];

interface PageLevel {
    key: Key;
    type: unknown;
}

/**
 * Identifies the page a router state shows by what React renders for each matched route: React Router renders the
 * levels without keys, so a level whose element type and key are unchanged keeps its component mounted, even across
 * sibling routes (e.g. the same page at "index" and "overview"). Params and the query string don't count, since a
 * change to those alone keeps the same page mounted. Descendant <Routes> under a splat route aren't in the router's
 * matches, so all of a splat section counts as one page.
 * TODO: Kanban 2258: navigation within a splat section (e.g. a workflow job back to the job list) never aborts here.
 */
function getPage(state: RouterState): PageLevel[] {
    return state.matches.map(({ route }) => {
        if (route.Component) return { key: null, type: route.Component };
        if (isValidElement(route.element)) return { key: route.element.key, type: route.element.type };
        return { key: null, type: null };
    });
}

function isSamePage(a: PageLevel[], b: PageLevel[]): boolean {
    return a.length === b.length && a.every((level, i) => level.type === b[i].type && level.key === b[i].key);
}

/**
 * Aborts the cancellable requests still in flight when the router leaves a page, since the page that made them is
 * gone. Aborting a cancellable request also asks the server to stop it. Requests made by components that outlive the
 * page, such as the app shell or a layout around child routes, must opt out with `cancellable: false`.
 * Install it before rendering the RouterProvider: subscribers run in the order they were added, so this one must see a
 * route change before React renders the new page.
 * @returns a function that removes the backstop.
 */
export function installRouteBackstop(router: DataRouter): () => void {
    let page = getPage(router.state);

    return router.subscribe(state => {
        const nextPage = getPage(state);
        if (isSamePage(nextPage, page)) return;
        page = nextPage;

        // Snapshot before the new page mounts and makes its own requests; abort on a later task, which usually runs
        // after React has unmounted the old page, so its failure handlers don't run against a mounted page
        const abandoned = Ajax.getCancellableRequests();
        if (abandoned.length > 0) {
            setTimeout(() => abandoned.forEach(xhr => xhr.abort()));
        }
    });
}
