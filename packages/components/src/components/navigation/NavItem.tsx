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
import React, { createRef, PureComponent, ReactNode, RefObject } from 'react';
import * as PropTypes from 'prop-types';
import { InjectedRouter, Link } from 'react-router';

import { AppURL } from '../..';

interface NavItemProps {
    onActive?: (activeEl: HTMLElement) => void;
    to: string | AppURL;
}

export class NavItem extends PureComponent<NavItemProps> {
    // required for react-router to display active links properly
    static contextTypes = {
        router: PropTypes.object.isRequired,
    };

    context: {
        router: InjectedRouter;
    };

    itemRef: RefObject<HTMLLIElement>;

    constructor(props: NavItemProps) {
        super(props);

        this.itemRef = createRef();
    }

    componentDidUpdate = (): void => {
        if (this.props.onActive && this.isActive()) {
            this.props.onActive(this.itemRef.current);
        }
    };

    isActive = (): boolean => {
        if (this.props.to && this.context.router) {
            // Formerly, we used this.context.router.isActive(to.toString()), however,
            // it is case-sensitive. See https://github.com/ReactTraining/react-router/issues/3472
            const { pathname } = (this.context.router as any).getCurrentLocation();
            return pathname.toLowerCase() === this.props.to.toString().toLowerCase();
        }

        return false;
    };

    render = (): ReactNode => {
        return (
            <li className={this.isActive() ? 'active' : null} ref={this.itemRef}>
                <Link to={this.props.to.toString()}>{this.props.children}</Link>
            </li>
        );
    };
}

export class ParentNavItem extends PureComponent<NavItemProps> {
    render = (): ReactNode => {
        return (
            <div className="parent-nav">
                <ul className="nav navbar-nav">
                    <li>
                        <Link to={this.props.to.toString()}>
                            <i className="fa fa-chevron-left" />
                            &nbsp;
                            {this.props.children}
                        </Link>
                    </li>
                </ul>
            </div>
        );
    };
}
