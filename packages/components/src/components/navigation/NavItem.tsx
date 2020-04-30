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
import React from 'react';
import * as PropTypes from 'prop-types';
import { InjectedRouter, Link } from 'react-router';

import { AppURL } from '../../url/AppURL';

interface NavItemProps {
    onlyActiveOnIndex?: boolean;
    onActive?: Function;
    to: string | AppURL;
}

export class NavItem extends React.Component<NavItemProps, any> {
    // required for react-router to display active links properly
    static contextTypes = {
        router: PropTypes.object.isRequired,
    };

    static defaultProps = {
        onlyActiveOnIndex: false,
    };

    context: {
        router: InjectedRouter;
    };

    private item: React.RefObject<HTMLLIElement>;

    constructor(props: NavItemProps) {
        super(props);

        this.item = React.createRef();
    }

    componentWillReceiveProps(nextProps: NavItemProps) {
        if (nextProps.onActive && this.isActive(nextProps)) {
            nextProps.onActive(this.item.current);
        }
    }

    isActive(props: NavItemProps) {
        const { onlyActiveOnIndex, to } = props;

        // This is using the same pattern as <Link> to determine if the route is active
        if (to && this.context.router) {
            return this.context.router.isActive(to.toString(), onlyActiveOnIndex);
        }

        return false;
    }

    render() {
        const { to } = this.props;

        return (
            <li className={this.isActive(this.props) ? 'active' : null} ref={this.item}>
                <Link to={to.toString()}>{this.props.children}</Link>
            </li>
        );
    }
}

export class ParentNavItem extends React.Component<NavItemProps, any> {
    render() {
        const { to } = this.props;

        return (
            <div className="parent-nav">
                <ul className="nav navbar-nav">
                    <li>
                        <Link to={to.toString()}>
                            <i className="fa fa-chevron-left" />
                            &nbsp;
                            {this.props.children}
                        </Link>
                    </li>
                </ul>
            </div>
        );
    }
}
