import React, { PureComponent, ReactNode } from 'react';

import { LoadingSpinner } from '../../internal/components/base/LoadingSpinner';

import { RequiresModelAndActions } from './withQueryModels';

export class SelectionStatus extends PureComponent<RequiresModelAndActions> {
    clearSelections = (): void => {
        this.props.actions.clearSelections(this.props.model.id);
    };

    selectAll = (): void => {
        this.props.actions.selectAllRows(this.props.model.id);
    };

    clearText = (): string => {
        const { selections } = this.props.model;
        let clearText = 'Clear';

        if (selections.size === 2) {
            clearText = clearText + ' both';
        } else if (selections.size > 2) {
            clearText = clearText + ' all';
        }

        return clearText;
    };

    render(): ReactNode {
        const { model } = this.props;
        const { isLoading, isLoadingSelections, isLoadingTotalCount, maxRows, rowCount, selections } = model;

        if (isLoading || isLoadingSelections || !selections) {
            return null;
        }

        const selectionSize = selections.size;
        let selectionCount;
        let clearAllButton;
        let selectAllButton;

        if (selectionSize > 0) {
            selectionCount = (
                <span className="selection-status__count">
                    {selectionSize.toLocaleString()} of{' '}
                    {isLoadingTotalCount ? <LoadingSpinner msg="" /> : rowCount.toLocaleString()} selected
                </span>
            );

            clearAllButton = (
                <span className="selection-status__clear-all">
                    <button className="btn btn-default btn-xs" onClick={this.clearSelections} type="button">
                        {this.clearText()}
                    </button>
                </span>
            );
        }

        if (rowCount > maxRows && selectionSize !== rowCount && rowCount > 0) {
            selectAllButton = (
                <span className="selection-status__select-all">
                    <button className="btn btn-default btn-xs" onClick={this.selectAll} type="button">
                        Select all {!isLoadingTotalCount ? rowCount.toLocaleString() : ''}
                    </button>
                </span>
            );
        }

        return (
            <div className="selection-status">
                {selectionCount}
                {selectAllButton}
                {clearAllButton}
            </div>
        );
    }
}
