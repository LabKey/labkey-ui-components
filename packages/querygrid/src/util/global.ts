import createHistory from 'history/createBrowserHistory'

import { getGlobal, setGlobal } from "reactn";

/**
 * Initialize the global state object for this package.
 */
export function initBrowserHistoryState() {
    if (!getGlobal().utils) {
        setGlobal( {
            QueryGrid_browserHistory: createHistory()
        },

        (global) => {
            // add a no-op listener just to connect this global state history to the url changes
            getBrowserHistory().listen((location, action) => {});
        });
    }
}

/**
 * Access method for better browser history object from global state
 */
export function getBrowserHistory() {
    if (!getGlobal().QueryGrid_browserHistory) {
        throw new Error('Must call initBrowserHistoryState before you can access the global.QueryGrid_browserHistory object.');
    }

    return getGlobal().QueryGrid_browserHistory;
}