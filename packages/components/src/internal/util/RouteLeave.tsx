import React from 'react';
import { WithRouterProps } from 'react-router';

import { AppURL } from '../..';

import { BeforeUnload } from './BeforeUnload';
import { Location } from 'history';
import { getBrowserHistory } from './global';

export const ON_LEAVE_DIRTY_STATE_MESSAGE =
    'You have unsaved changes that will be lost. Are you sure you want to continue?';

/**
 * This function can be used as the callback for react-router's setRouteLeaveHook.  It should be preferred
 * over a callback that simply returns the confirm message because with react-router v3.x, the URL route
 * will have already been changed by the time this confirm is shown and will not be reset if the user does not confirm.
 * If the user tries to click on the initial link again after canceling, nothing will happen because the URL
 * in the browser will not change. (Issue 39633).
 * See also https://stackoverflow.com/questions/32841757/detecting-user-leaving-page-with-react-router
 *
 * TODO: Seems like there are some additional tools in newer versions of react-router:
 *  https://stackoverflow.com/questions/62792342/in-react-router-v6-how-to-check-form-is-dirty-before-leaving-page-route
 *
 * @param currentLocation the location of the current page
 */
export function confirmLeaveWhenDirty(currentLocation: Location): boolean {
    const result = confirm(ON_LEAVE_DIRTY_STATE_MESSAGE);

    // navigation canceled, pushing the previous path
    if (!result && currentLocation) {
        const currentHashPath = AppURL.create(
            ...currentLocation.pathname
                .substring(1)
                .split('/')
                .map(part => decodeURIComponent(part))
        ).toHref() + currentLocation.search;

        const history = getBrowserHistory();
        // Needed because some links pre-add the history, while others don't Issue #41419
        if (currentHashPath !== history.location.hash)
            window.history.go(-1); //pop the stack as the new location was already pushed on

        // Replace the state so things look handled -- prevents onbeforeunload from re-prompting
        window.history.replaceState(null, null, currentHashPath);
    }

    return result;
}

interface RouteLeaveInjectedProps {
    setDirty: (dirty: boolean) => void;
    isDirty: () => boolean;
}

export type RouteLeaveProps = RouteLeaveInjectedProps & WithRouterProps;

/**
 * A HOC to be used for any app React page that needs to check for a dirty state on route navigation / change.
 * Note that this also makes use of the BeforeUnload HOC for the browser page navigation / reload case.
 */
export const withRouteLeave = (Component: React.ComponentType) => {
    return class RouteLeaveHOCImpl extends React.Component<RouteLeaveProps> {
        _dirty = false;

        componentDidMount(): void {
            // attach the hook to the current route, which will be the last index of the routes prop
            this.props.router.setRouteLeaveHook(this.props.routes[this.props.routes.length - 1], this.onRouteLeave);
        }

        onRouteLeave = event => {
            if (this._dirty) {
                event.returnValue = true; // this is for the page reload case
                return confirmLeaveWhenDirty(this.props.location);
            }
        };

        setDirty = (dirty: boolean): void => {
            this._dirty = dirty;
        };

        isDirty = (): boolean => {
            return this._dirty;
        };

        render() {
            return (
                <BeforeUnload beforeunload={this.onRouteLeave}>
                    <Component setDirty={this.setDirty} isDirty={this.isDirty} {...this.props} />
                </BeforeUnload>
            );
        }
    };
};
