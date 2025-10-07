import React, { FC, memo, useCallback, useMemo } from 'react';

import { getServerContext } from '@labkey/api';

import { LoadingSpinner } from '../../internal/components/base/LoadingSpinner';

import { RequiresModelAndActions } from './withQueryModels';

export const SelectionStatus: FC<RequiresModelAndActions> = memo(({ actions, model }) => {
    const { isLoading, isLoadingSelections, isLoadingTotalCount, maxRows, rowCount, selections } = model;
    const selectionSize = selections?.size;
    const maxSelectionSize = useMemo(() => getServerContext().moduleContext?.query?.maxQuerySelection, []);

    const clearSelections = useCallback((): void => {
        actions.clearSelections(model.id);
    }, [actions, model.id]);

    const selectAll = useCallback((): void => {
        actions.selectAllRows(model.id);
    }, [actions, model.id]);

    const clearText = useMemo((): string => {
        let text = 'Clear';

        if (selectionSize === 2) {
            text = text + ' both';
        } else if (selectionSize > 2) {
            text = text + ' all';
        }

        return text;
    }, [selectionSize]);

    if (isLoading || isLoadingSelections || !selections) {
        return null;
    }

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
                <button className="btn btn-default btn-xs" onClick={clearSelections} type="button">
                    {clearText}
                </button>
            </span>
        );
    }

    if (
        rowCount > maxRows &&
        selectionSize !== rowCount &&
        rowCount > 0 &&
        !isLoadingTotalCount &&
        selectionSize < maxSelectionSize
    ) {
        // TODO: Should we clear pagination argument if this is clicked so they go back to the first page if the selection is maxed out?
        const tooManyRows = rowCount > maxSelectionSize;
        selectAllButton = (
            <span className="selection-status__select-all">
                <button className="btn btn-default btn-xs" onClick={selectAll} type="button">
                    {tooManyRows && <>Select first {maxSelectionSize.toLocaleString()}</>}
                    {!tooManyRows && <>Select all {rowCount.toLocaleString()}</>}
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
});
SelectionStatus.displayName = 'SelectionStatus';
