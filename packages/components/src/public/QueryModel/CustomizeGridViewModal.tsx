import React, { FC, memo, ReactNode, useCallback, useMemo, useState } from 'react';

import { saveAsSessionView } from '../../internal/actions';
import { getQueryDetails } from '../../internal/query/api';
import { showPremiumFeatures } from '../../internal/components/administration/utils';
import { ColumnSelectionModal } from '../../internal/components/ColumnSelectionModal';

import { QueryColumn } from '../QueryColumn';

import { SCHEMAS } from '../../internal/schemas';

import { QueryModel } from './QueryModel';

export const includedColumnsForCustomizationFilter = (column: QueryColumn, showAllColumns: boolean): boolean => {
    const isAncestor = column.fieldKeyPath?.indexOf('/Ancestors') >= 0;
    const isAncestorChild = column.fieldKeyPath?.indexOf('Ancestors/') >= 0;
    const isRunSampleAncestor = isAncestor && column.fieldKeyPath?.indexOf('Run/') >= 0;
    // don't allow multiple levels of ancestors since the ancestor value may not be a valid rowId to join through
    const isNestedAncestor =
        column.fieldKeyPath?.indexOf('Ancestors/') !== column.fieldKeyPath?.lastIndexOf('/Ancestors') + 1;
    return (
        (showAllColumns || !column.hidden) &&
        !column.removeFromViews &&
        (showPremiumFeatures() || !column.removeFromViewCustomization) &&
        !isRunSampleAncestor &&
        // Issue 46870: Don't allow selection/inclusion of multi-valued lookup fields from Ancestors
        (!isAncestorChild || (!isNestedAncestor && !column.isJunctionLookup()))
    );
};

interface Props {
    model: QueryModel;
    onCancel: () => void;
    onUpdate: () => void;
    selectedColumn?: QueryColumn;
}

export const CustomizeGridViewModal: FC<Props> = memo(props => {
    const { model, onCancel, onUpdate, selectedColumn } = props;
    const { title, queryInfo } = model;
    const [saveError, setSaveError] = useState<string>();
    const gridName = title ?? model.schemaQuery.queryName;
    const initialSelectedColumns = useMemo(() => model.displayColumns, [model]);

    const onExpand = useCallback(
        async (column: QueryColumn) => {
            const fkQueryInfo = await getQueryDetails({
                fk: column.index,
                lookup: column.lookup,
                schemaQuery: queryInfo.schemaQuery,
            });
            // For data classes, we want to limit the Ancestor filters to exclude 'Samples'
            if (column.index === 'Ancestors' && queryInfo.schemaQuery.schemaName === SCHEMAS.DATA_CLASSES.SCHEMA) {
                fkQueryInfo.columns = fkQueryInfo.columns.filter(
                    col => col.fieldKey !== 'Samples' && col.fieldKey !== 'MediaSamples'
                );
            }
            return fkQueryInfo;
        },
        [queryInfo]
    );

    const onSubmit = useCallback(
        async (selectedColumns: QueryColumn[]) => {
            try {
                setSaveError(undefined);
                const viewInfo = model.currentView.mutate({
                    columns: selectedColumns.map(col => ({
                        fieldKey: col.fieldKeyPath /* Issue 46256: use encoded fieldKeyPath */,
                        title: model.getCustomViewTitleOverride(col),
                    })),
                });
                await saveAsSessionView(model.schemaQuery, model.containerPath, viewInfo);
                onCancel();
                onUpdate();
            } catch (error) {
                setSaveError(error);
            }
        },
        [onCancel, onUpdate, model]
    );

    const titleNode = useMemo<ReactNode>(
        () => (
            <>
                Customize {gridName} Grid{model.viewName && ' - ' + model.viewName}
                {model.currentView.session && (
                    <span className="alert-info view-edit-alert view-edit-title-alert">Edited</span>
                )}
            </>
        ),
        [gridName, model.viewName, model.currentView.session]
    );

    return (
        <ColumnSelectionModal
            allowEditLabel
            allowShowAll
            confirmText="Update Grid"
            expandedColumnFilter={includedColumnsForCustomizationFilter}
            initialSelectedColumn={selectedColumn}
            initialSelectedColumns={initialSelectedColumns}
            onCancel={onCancel}
            onExpand={onExpand}
            onSubmit={onSubmit}
            queryInfo={model.queryInfo}
            rightColumnTitle="Shown in Grid"
            saveError={saveError}
            title={titleNode}
        />
    );
});
