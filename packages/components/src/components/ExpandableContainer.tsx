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
}

interface State {
    isHover?: boolean;
    visible?: boolean;
}

export class ExpandableContainer extends React.PureComponent<Props, State> {
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
        const { children, iconSrc, iconFaCls, isExpandable, clause, links } = this.props;
        const { visible, isHover } = this.state;

        return (
            <div className={classNames('row', 'container-expandable', { disabled: !isExpandable })}>
                <div
                    onClick={isExpandable ? this.handleClick : undefined}
                    onMouseEnter={isExpandable ? this.handleMouseEnter : undefined}
                    onMouseLeave={isExpandable ? this.handleMouseLeave : undefined}
                    className={classNames(
                        'container-expandable-detail',
                        { 'container-expandable-child__inactive': visible },
                        { 'container-expandable-detail__active': isHover || visible },
                        { 'container-expandable-detail__inactive': !isHover && !visible }
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
