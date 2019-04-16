/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import * as PropTypes from 'prop-types'
import { Link, InjectedRouter } from 'react-router'

import { AppURL } from '@glass/base'

interface NavItemProps {
    onlyActiveOnIndex?: boolean
    onActive?: Function
    to: string | AppURL
}

export class NavItem extends React.Component<NavItemProps, any> {

    // required for react-router to display active links properly
    static contextTypes = {
        router: PropTypes.object.isRequired
    };

    static defaultProps = {
        onlyActiveOnIndex: false
    };

    context: {
        router: InjectedRouter
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
            <li className={this.isActive(this.props) ? "active" : null} ref={this.item}>
                <Link to={to.toString()}>
                    {this.props.children}
                </Link>
            </li>
        )
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
                            <i className="fa fa-chevron-left"/>&nbsp;
                            {this.props.children}
                        </Link>
                    </li>
                </ul>
            </div>
        )
    }
}