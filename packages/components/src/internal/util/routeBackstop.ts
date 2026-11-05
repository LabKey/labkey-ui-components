/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Ajax } from '@labkey/api';
import type { DataRouter } from 'react-router';

type RouterState = DataRouter['state'];

/**
 * Identifies the page a router state shows: its matched routes, ignoring their params and the query string, since a
 * change to those alone keeps the same page mounted. Descendant <Routes> under a splat route aren't in the router's
 * matches, so all of a splat section counts as one page: their params can't be told apart from path segments.
 * TODO: Kanban 2258: navigation within a splat section (e.g. a workflow job back to the job list) never aborts here.
 */
function getPageKey(state: RouterState): string {
    return state.matches.map(match => match.route.id).join('>');
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
    let pageKey = getPageKey(router.state);

    return router.subscribe(state => {
        const nextPageKey = getPageKey(state);
        if (nextPageKey === pageKey) return;
        pageKey = nextPageKey;

        // Snapshot before the new page mounts and makes its own requests; abort on a later task, which usually runs
        // after React has unmounted the old page, so its failure handlers don't run against a mounted page
        const abandoned = Ajax.getCancellableRequests();
        if (abandoned.length > 0) {
            setTimeout(() => abandoned.forEach(xhr => xhr.abort()));
        }
    });
}
