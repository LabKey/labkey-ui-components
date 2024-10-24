/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PropsWithChildren } from 'react';
import classNames from 'classnames';

import { SVGIcon } from './base/SVGIcon';

interface Props extends PropsWithChildren {
    clause: React.ReactNode;
    rowCls?: string;
    containerCls?: string;
    iconFaCls?: string;
    iconSrc?: string;
    noIcon?: boolean;
    initExpanded?: boolean;
    isExpandable: boolean;
    links: React.ReactNode;
    onClick?: (show: boolean) => void;
    useGreyTheme?: boolean;
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

    handleClick = (): void => {
        if (!this.props.isExpandable) {
            this.props.onClick?.(false);
            return;
        }

        this.setState(
            state => ({
                visible: !state.visible,
            }),
            () => {
                this.props.onClick?.(this.state.visible);
            }
        );
    };

    handleMouseEnter = (): void => {
        this.setState(() => ({ isHover: true }));
    };

    handleMouseLeave = (): void => {
        this.setState(() => ({ isHover: false }));
    };

    render() {
        const { children, rowCls = 'row', noIcon, iconSrc, iconFaCls, isExpandable, clause, links, containerCls, useGreyTheme } = this.props;
        const { visible, isHover } = this.state;
        const hasOnClick = this.props.onClick !== undefined;
        const containerDivCls = useGreyTheme ? 'container-expandable-grey' : 'container-expandable-blue';

        return (
            <div className={classNames(rowCls, 'container-expandable', { disabled: !isExpandable })}>
                <div
                    onClick={hasOnClick || isExpandable ? this.handleClick : undefined}
                    onMouseEnter={isExpandable ? this.handleMouseEnter : undefined}
                    onMouseLeave={isExpandable ? this.handleMouseLeave : undefined}
                    className={classNames(
                        containerCls,
                        containerDivCls,
                        { 'container-expandable-child__inactive': visible },
                        { 'container-expandable__active': isHover || visible },
                        { 'container-expandable__inactive': !isHover && !visible }
                    )}
                >
                    {!noIcon &&
                        <i className="container-expandable-child__img">
                            {iconFaCls ? (
                                <i style={{padding: '5px'}} className={'fa fa-' + iconFaCls}/>
                            ) : (
                                <SVGIcon iconSrc={iconSrc} isActive={isHover} height="50px" width="50px"/>
                            )}
                        </i>
                    }
                    <div
                        onClick={hasOnClick || isExpandable ? this.handleClick : undefined}
                        className={classNames('pull-right', 'container-expandable-child__chevron', {
                            'text-muted': !isExpandable,
                        })}
                    >
                    <i
                            onClick={hasOnClick || isExpandable ? this.handleClick : undefined}
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
