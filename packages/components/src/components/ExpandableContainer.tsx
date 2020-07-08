/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import classNames from 'classnames';

import { SVGIcon } from './base/SVGIcon';

interface Props {
    clause: React.ReactNode;
    links: React.ReactNode;
    iconSrc?: string;
    iconFaCls?: string;
    isExpandable: boolean;
    initExpanded?: boolean;
    onClick?: (show: boolean) => any;
    iconClickOnly?: boolean;
}

interface State {
    isHover?: boolean;
    visible?: boolean;
}

export class ExpandableContainer extends React.PureComponent<Props, State> {
    static defaultProps = {
        iconClickOnly: false,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            visible: props.initExpanded || false,
            isHover: false,
        };
    }

    handleClick = () => {
        this.setState(
            state => ({
                visible: !state.visible,
            }),
            () => {
                if (this.props.onClick) this.props.onClick(this.state.visible);
            }
        );
    };

    handleMouseEnter = () => {
        this.setState(() => ({ isHover: true }));
    };

    handleMouseLeave = () => {
        this.setState(() => ({ isHover: false }));
    };

    render() {
        const { children, iconSrc, iconFaCls, isExpandable, clause, links, iconClickOnly } = this.props;
        const { visible, isHover } = this.state;
        const containerCls = iconClickOnly ? 'container-expandable-icononly' : 'container-expandable-detail';

        return (
            <div className={classNames('row', 'container-expandable', { disabled: !isExpandable })}>
                <div
                    onClick={isExpandable && !iconClickOnly ? this.handleClick : undefined}
                    onMouseEnter={isExpandable ? this.handleMouseEnter : undefined}
                    onMouseLeave={isExpandable ? this.handleMouseLeave : undefined}
                    className={classNames(
                        containerCls,
                        { 'container-expandable-child__inactive': visible },
                        { 'container-expandable__active': isHover || visible },
                        { 'container-expandable__inactive': !isHover && !visible }
                    )}
                >
                    <i className="container-expandable-child__img">
                        {iconFaCls ? (
                            <i style={{ padding: '5px' }} className={'fa fa-' + iconFaCls} />
                        ) : (
                            <SVGIcon
                                iconDir="_images"
                                iconSrc={iconSrc}
                                isActive={isHover}
                                height="50px"
                                width="50px"
                            />
                        )}
                    </i>
                    <div
                        onClick={isExpandable && iconClickOnly ? this.handleClick : undefined}
                        className={classNames('pull-right', 'container-expandable-child__chevron', {
                            'text-muted': !isExpandable,
                        })}
                    >
                        <i
                            className={classNames('fa', {
                                'fa-chevron-down': visible,
                                'fa-chevron-right': !visible,
                            })}
                        />
                    </div>
                    <div className="container-expandable-heading">
                        {clause}
                        {links}
                    </div>
                </div>
                {visible && children}
            </div>
        );
    }
}
