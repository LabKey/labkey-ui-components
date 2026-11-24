/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useMemo } from 'react';
import classNames from 'classnames';

import { LoadingSpinner } from '../../internal/components/base/LoadingSpinner';
import { RequiresModelAndActions } from './withQueryModels';
import { useServerContext } from '../../internal/components/base/ServerContext';

export const SelectionStatus: FC<RequiresModelAndActions> = memo(({ actions, model }) => {
    const { hasData, isLoadingSelections, isLoadingTotalCount, maxRows, rowCount, rowCountCapped, selections } = model;
    const selectionSize = selections?.size;
    const { moduleContext } = useServerContext();
    const maxSelectionSize = moduleContext?.query?.maxQuerySelection;

    const clearSelections = useCallback((): void => {
        if (!isLoadingSelections) actions.clearSelections(model.id);
    }, [actions, isLoadingSelections, model.id]);

    const selectAll = useCallback((): void => {
        if (!isLoadingSelections) actions.selectAllRows(model.id);
    }, [actions, isLoadingSelections, model.id]);

    const buttonClassName = classNames('btn btn-default btn-xs', { disabled: isLoadingSelections });

    const clearText = useMemo((): string => {
        let text = 'Clear';

        if (selectionSize === 2) {
            text = text + ' both';
        } else if (selectionSize > 2) {
            text = text + ' all';
        }

        return text;
    }, [selectionSize]);

    // Kept on screen while paging or a selection change loads, so the grid info row doesn't jump
    if (!hasData || !selections) {
        return null;
    }

    let selectionCount;
    let clearAllButton;
    let selectAllButton;

    const tooManyRows = rowCountCapped || rowCount > maxSelectionSize;

    if (selectionSize > 0) {
        selectionCount = (
            <span className="selection-status__count">
                {selectionSize.toLocaleString()} of{' '}
                {isLoadingTotalCount ? (
                    <LoadingSpinner msg="" />
                ) : (
                    // "+" means the total is a capped floor; an exact count keeps no "+" even when it exceeds maxSelectionSize
                    `${rowCount?.toLocaleString() ?? ''}${rowCountCapped ? '+' : ''}`
                )}{' '}
                selected
            </span>
        );

        clearAllButton = (
            <span className="selection-status__clear-all">
                <button
                    // aria-disabled, unlike disabled, keeps focus on the button while the selection change it started saves
                    aria-disabled={isLoadingSelections}
                    className={buttonClassName}
                    onClick={clearSelections}
                    type="button"
                >
                    {clearText}
                </button>
            </span>
        );
    }

    if (
        rowCount > maxRows &&
        (rowCountCapped || selectionSize !== rowCount) &&
        rowCount > 0 &&
        !isLoadingTotalCount &&
        selectionSize < maxSelectionSize
    ) {
        selectAllButton = (
            <span className="selection-status__select-all">
                <button
                    aria-disabled={isLoadingSelections}
                    className={buttonClassName}
                    onClick={selectAll}
                    type="button"
                >
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
