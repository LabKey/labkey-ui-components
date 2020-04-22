import React, { PureComponent } from 'react';
import { RequiresModelAndActions } from './withQueryModels';
import { Button } from 'react-bootstrap';

export class SelectionStatus extends PureComponent<RequiresModelAndActions> {
    clearSelections = () => {
        this.props.actions.clearSelections(this.props.model.id);
    };

    selectAll = () => {
        this.props.actions.selectAllRows(this.props.model.id);
    };

    clearText = () => {
        const { selections } = this.props.model;
        let clearText = 'Clear';

        if (selections.size === 2) {
            clearText = clearText + ' both';
        } else if (selections.size > 2) {
            clearText = clearText + ' all';
        }

        return clearText;
    };

    render() {
        const { model } = this.props;
        const { hasSelections, isLoading, isLoadingSelections, maxRows, rowCount, selections } = model;

        if (isLoading || isLoadingSelections || !hasSelections) {
            return null;
        }

        const selectionSize = selections.size;
        let selectionCount;
        let clearAllButton;
        let selectAllButton;

        if (selectionSize > 0) {
            selectionCount = (
                <span className="selection-status__count">
                    {selectionSize} of {rowCount} selected
                </span>
            );

            clearAllButton = (
                <span className="selection-status__clear-all">
                    <Button bsSize="xsmall" onClick={this.clearSelections}>
                        {this.clearText()}
                    </Button>
                </span>
            );
        }

        if (rowCount > maxRows && selectionSize !== rowCount && rowCount > 0) {
            selectAllButton = (
                <span className="selection-status__select-all">
                    <Button bsSize="xsmall" onClick={this.selectAll}>
                        Select all {rowCount}
                    </Button>
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
