import React from 'react';
import { WithRouterProps } from 'react-router';

import { confirmLeaveWhenDirty } from '../components/navigation/utils';

import { BeforeUnload } from './BeforeUnload';

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
