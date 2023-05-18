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
                <div onClick={toggleFilterPanel} className={panelCls}>
                    {filterExpanded ? 'Hide filters ' : 'Show filters '}
                    <i
                        className={classNames('fa', {
                            'fa-chevron-down': filterExpanded,
                            'fa-chevron-right': !filterExpanded,
                        })}
                    />
                </div>
                {hasFilter && (
                    <span className="clickable-text" onClick={resetFilter}>
                        Clear All
                    </span>
                )}
            </>
        );
    }
}
