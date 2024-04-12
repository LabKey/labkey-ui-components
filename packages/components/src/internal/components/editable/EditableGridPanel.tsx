import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { fromJS } from 'immutable';
import classNames from 'classnames';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { getUniqueIdColumnMetadata } from '../entities/utils';

import { QueryColumn } from '../../../public/QueryColumn';

import { EXPORT_TYPES } from '../../constants';

import { ExportOption } from '../../../public/QueryModel/ExportMenu';

import { EditorModel } from './models';

import { EditableGrid, EditableGridChange, SharedEditableGridPanelProps } from './EditableGrid';

import { exportEditedData, getEditorExportData } from './utils';

export interface EditableGridPanelProps extends SharedEditableGridPanelProps {
    allowExport?: boolean;
    editorModel: EditorModel | EditorModel[];
    getIsDirty?: () => boolean;
    model: QueryModel | QueryModel[];
    onChange: EditableGridChange;
    setIsDirty?: (isDirty: boolean) => void;
}

const exportHandler = (
    exportType: EXPORT_TYPES,
    models: QueryModel[],
    editorModels: EditorModel[],
    activeTab: number,
    readOnlyColumns: string[],
    insertColumns?: QueryColumn[],
    updateColumns?: QueryColumn[],
    forUpdate?: boolean,
    extraColumns?: Array<Partial<QueryColumn>>,
    colFilter?: (col: QueryColumn) => boolean
): void => {
    const exportData = getEditorExportData(
        editorModels,
        models,
        readOnlyColumns,
        insertColumns,
        updateColumns,
        forUpdate,
        extraColumns,
        colFilter
    );
    exportEditedData(exportType, 'data', exportData, models[activeTab]);
};

/**
 * Note that there are some cases which will call the onChange callback prop back to back (i.e. see LookupCell.onInputChange)
 * and pass through different sets of `editorModelChanges`. In that case, you will want to make sure that your onChange
 * handler is getting the current state object before merging in the `editorModelChanges`. See example in platform/core
 * (core/src/client/LabKeyUIComponentsPage/EditableGridPage.tsx) which uses the set state function which takes a function
 * as the first parameter instead of the new state object.
 */
export const EditableGridPanel: FC<EditableGridPanelProps> = memo(props => {
    const {
        allowExport = true,
        editorModel,
        model,
        onChange,
        title,
        bsStyle,
        className = '',
        columnMetadata,
        getColumnMetadata,
        readonlyRows,
        getReadOnlyRows,
        updateColumns,
        getUpdateColumns,
        getTabHeader,
        getTabTitle,
        readOnlyColumns,
        extraExportColumns,
        forUpdate,
        insertColumns,
        exportColFilter,
        getIsDirty,
        setIsDirty,
        ...gridProps
    } = props;

    const [activeTab, setActiveTab] = useState<number>(props.activeTab ?? 0);
    const models = Array.isArray(model) ? model : [model];
    const activeModel = models[activeTab];
    const editorModels = Array.isArray(editorModel) ? editorModel : [editorModel];
    const activeEditorModel = editorModels[activeTab];
    const hasTabs = models.length > 1;
    let wasDirty = false;

    const _onChange = useCallback<EditableGridChange>(
        (event, editorModelChanges, dataKeys, data) => onChange(event, editorModelChanges, dataKeys, data, activeTab),
        [activeTab, onChange]
    );

    // TODO: When EditableGridPanelDeprecated is removed we should be able to just pass model.rows and model.orderedRows
    //  to the EditableGrid.
    const { orderedRows, queryInfo, rows } = activeModel;
    const data = useMemo(() => fromJS(rows), [rows]);
    const dataKeys = useMemo(() => fromJS(orderedRows), [orderedRows]);
    const error = activeModel.hasLoadErrors
        ? activeModel.loadErrors[0] ?? 'Something went wrong loading the data.'
        : undefined;

    let activeColumnMetadata = columnMetadata;
    if (!activeColumnMetadata && getColumnMetadata) activeColumnMetadata = getColumnMetadata(activeTab);
    if (!activeColumnMetadata) activeColumnMetadata = getUniqueIdColumnMetadata(queryInfo);

    let activeReadOnlyRows = readonlyRows;
    if (!activeReadOnlyRows && getReadOnlyRows) activeReadOnlyRows = getReadOnlyRows(activeTab);

    let activeUpdateColumns = updateColumns;
    if (!activeUpdateColumns && getUpdateColumns) activeUpdateColumns = getUpdateColumns(activeTab);

    const exportHandlerCallback = useCallback(
        (option: ExportOption) => {
            // We temporarily unset the dirty bit on the page so the download doesn't produce an alert
            if (getIsDirty && setIsDirty) {
                wasDirty = getIsDirty();
                setIsDirty(false);
            }
            exportHandler(
                option.type,
                models,
                editorModels,
                activeTab,
                readOnlyColumns,
                insertColumns,
                updateColumns,
                forUpdate,
                extraExportColumns,
                exportColFilter
            );
            // timeout needed here to wait for the download to begin. Value of 1000 not chosen scientifically.
            window.setTimeout(() => {
                if (setIsDirty && wasDirty) {
                    wasDirty = false;
                    setIsDirty(true);
                }
            }, 1000);
        },
        [
            activeTab,
            editorModels,
            extraExportColumns,
            models,
            readOnlyColumns,
            insertColumns,
            updateColumns,
            forUpdate,
            extraExportColumns,
            exportColFilter,
        ]
    );

    const onTabClick = useCallback(setActiveTab, []);

    const editableGrid = (
        <EditableGrid
            {...gridProps}
            columnMetadata={activeColumnMetadata}
            data={data}
            dataKeys={dataKeys}
            editorModel={activeEditorModel}
            error={error}
            onChange={_onChange}
            queryInfo={queryInfo}
            readonlyRows={activeReadOnlyRows}
            readOnlyColumns={readOnlyColumns}
            updateColumns={activeUpdateColumns}
            exportHandler={allowExport ? exportHandlerCallback : undefined}
            exportColFilter={exportColFilter}
            insertColumns={insertColumns}
            forUpdate={forUpdate}
        />
    );

    if (!title) {
        return editableGrid;
    }

    return (
        <div className={`panel ${bsStyle === 'info' ? 'panel-info' : 'panel-default'} ${className}`}>
            <div className="panel-heading">{title}</div>
            <div className="panel-body table-responsive">
                {hasTabs && (
                    <ul className="nav nav-tabs">
                        {models.map((tabModel, index) => {
                            if (tabModel) {
                                let tabTitle = tabModel.title ?? tabModel.queryName;
                                if (getTabTitle) tabTitle = getTabTitle(index);

                                const classes = classNames({
                                    active: activeModel.id === tabModel.id,
                                });

                                return (
                                    <li key={tabModel.id} className={classes}>
                                        <a onClick={() => onTabClick(index)}>{tabTitle}</a>
                                    </li>
                                );
                            }
                            return null;
                        })}
                    </ul>
                )}
                {getTabHeader?.(activeTab)}
                {editableGrid}
            </div>
        </div>
    );
});
