import createHistory from 'history/createBrowserHistory'

import { getGlobal, setGlobal } from "reactn";

/**
 * Initialize the global state object for this package.
 */
export function initBrowserHistoryState() {
    if (!getGlobal().utils) {
        setGlobal( {
            utils: {
                browserHistory: createHistory()
            }
        });
    }
}

/**
 * Access method for better browser history object from global state
 */
export function getBrowserHistory() {
    if (!getGlobal().utils || !getGlobal().utils.browserHistory) {
        throw new Error('Must call initBrowserHistoryState before you can access the global.utils.browserHistory object.');
    }

    return getGlobal().utils.browserHistory;
}