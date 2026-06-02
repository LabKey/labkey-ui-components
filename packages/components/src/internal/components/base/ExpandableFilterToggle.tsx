/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent, ReactNode } from 'react';
import classNames from 'classnames';

interface Props {
    filterExpanded: boolean;
    hasFilter: boolean;
    panelCls?: string;
    resetFilter: () => void;
    toggleFilterPanel: () => void;
}

export class ExpandableFilterToggle extends PureComponent<Props> {
    static defaultProps = {
        panelCls: 'show-hide-filter-toggle',
    };

    render(): ReactNode {
        const { filterExpanded, hasFilter, toggleFilterPanel, resetFilter, panelCls } = this.props;

        return (
            <>
                <button className={'clickable-text ' + panelCls} onClick={toggleFilterPanel} type="button">
                    {filterExpanded ? 'Hide filters ' : 'Show filters '}
                    <i
                        className={classNames('fa', {
                            'fa-chevron-down': filterExpanded,
                            'fa-chevron-right': !filterExpanded,
                        })}
                    />
                </button>
                {hasFilter && (
                    <button className="clickable-text margin-left" onClick={resetFilter} type="button">
                        Clear All
                    </button>
                )}
            </>
        );
    }
}
