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
import { getGlobal, setGlobal } from 'reactn';
import createHistory from 'history/createBrowserHistory';

/**
 * Initialize the global state object for this package.
 */
export function initBrowserHistoryState() {
    if (!getGlobal()['BrowserHistory']) {
        setGlobal(
            {
                BrowserHistory: createHistory(),
            },

            global => {
                // add a no-op listener just to connect this global state history to the url changes
                getBrowserHistory().listen((location, action) => {});
            }
        );
    }
}

/**
 * Access method for better browser history object from global state
 */
export function getBrowserHistory() {
    if (!getGlobal()['BrowserHistory']) {
        throw new Error('Must call initBrowserHistoryState before you can access the global.BrowserHistory object.');
    }

    return getGlobal()['BrowserHistory'];
}
