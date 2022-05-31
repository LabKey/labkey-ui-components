import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { fromJS, List, Map } from 'immutable';
import classNames from 'classnames';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { EditorModel, EditorModelProps } from '../../models';

import { EditableGrid, SharedEditableGridPanelProps } from './EditableGrid';
import { getUniqueIdColumnMetadata } from '../entities/utils';
import { ExportMenu } from '../../../public/QueryModel/ExportMenu';
import { EXPORT_TYPES } from '../../constants';
import { QueryColumn } from '../../../public/QueryColumn';
import { UtilsDOM } from '@labkey/api';

interface Props extends SharedEditableGridPanelProps {
    editorModel: EditorModel | EditorModel[];
    model: QueryModel | QueryModel[];
    onChange: (
        editorModelChanges: Partial<EditorModelProps>,
        dataKeys?: List<any>,
        data?: Map<string, Map<string, any>>,
        index?: number
    ) => void;
}

const getTableExportConfig = (exportType: EXPORT_TYPES, filename: string, exportData: Array<Array<any>>, activeModel: QueryModel): UtilsDOM.TextTableForm => {
    const config = {
        rows: exportData,
        fileNamePrefix: filename,
        queryinfo: {
            schema: activeModel.schemaName,
            query: activeModel.queryName,
        },
    } as UtilsDOM.TextTableForm;

    switch (exportType) {
        case EXPORT_TYPES.TSV:
            config.delim = UtilsDOM.DelimiterType.TAB;
            break;
        case EXPORT_TYPES.CSV:
        default:
            config.delim = UtilsDOM.DelimiterType.COMMA;
            break;
    }

    return config;
};

function exportEditedData(exportType: EXPORT_TYPES, filename: string, exportData: Array<Array<any>>, activeModel: QueryModel): void {
    if (EXPORT_TYPES.EXCEL === exportType) {
        const data = {
            fileName: filename + '.xlsx',
            sheets: [{name: 'data', data: exportData }],
            queryinfo: {
                schema: activeModel.schemaName,
                query: activeModel.queryName,
            },
        };
        UtilsDOM.convertToExcel(data);
        return;
    }

    const config = getTableExportConfig(exportType, filename, exportData, activeModel);
    UtilsDOM.convertToTable(config);
}

// Should this be coming from the props (higher components)?
const exportHandler = (exportType: EXPORT_TYPES, models: Array<QueryModel>, editorModels: Array<EditorModel>, readOnlyColumns: List<string>, getUpdateColumns: (tabId?: number) => List<QueryColumn>, activeTab: number ): void => {
    const headings = Map<string, string>().asMutable();
    const editorData = Map<string, Map<string,any>>().asMutable();
    models.forEach((queryModel, idx) => {
        const tabData = editorModels[idx]
            .getRawDataFromGridData(
                fromJS(queryModel.rows),
                fromJS(queryModel.orderedRows),
                queryModel.queryInfo,
                true,
                true,
                readOnlyColumns
            )
            .toArray();

        const updateColumns = queryModel.queryInfo.getUpdateColumns(readOnlyColumns);
        updateColumns.forEach(col => headings.set(col.fieldKey, col.isLookup() ? col.fieldKey : col.caption));

        tabData.forEach((row) => {
            const rowId = row.get('RowId');
            const draftRow = editorData.get(rowId) ?? Map<string, any>().asMutable();
            updateColumns.forEach(col => {
                draftRow.set(col.fieldKey, row.get(col.fieldKey));
            });

            editorData.set(rowId, draftRow);
        });
    });

    const rows = [];
    editorData.forEach(rowMap => rows.push([...rowMap.toArray().values()]));
    const exportData = [headings.toArray(), ...rows];

    exportEditedData(exportType, 'data', exportData, models[activeTab]);
};

/**
 * Note that there are some cases which will call the onChange callback prop back to back (i.e. see LookupCell.onInputChange)
 * and pass through different sets of `editorModelChanges`. In that case, you will want to make sure that your onChange
 * handler is getting the current state object before merging in the `editorModelChanges`. See example in platform/core
 * (core/src/client/LabKeyUIComponentsPage/EditableGridPage.tsx) which uses the set state function which takes a function
 * as the first parameter instead of the new state object.
 */
export const EditableGridPanel: FC<Props> = memo(props => {
    const {
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
        ...gridProps
    } = props;

    const [activeTab, setActiveTab] = useState<number>(props.activeTab ?? 0);
    const models = Array.isArray(model) ? model : [model];
    const activeModel = models[activeTab];
    const editorModels = Array.isArray(editorModel) ? editorModel : [editorModel];
    const activeEditorModel = editorModels[activeTab];
    const hasTabs = models.length > 1;

    const _onChange = useCallback(
        (editorModelChanges: Partial<EditorModelProps>, dataKeys?: List<any>, data?: Map<any, Map<string, any>>) =>
            onChange(editorModelChanges, dataKeys, data, activeTab),
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

    const csvExportHandlerCallback = useCallback(() => {
        exportHandler(EXPORT_TYPES.CSV, models, editorModels, readOnlyColumns, getUpdateColumns, activeTab);
    }, [models, editorModels, activeTab, activeEditorModel, readOnlyColumns, getUpdateColumns]);

    const tsvExportHandlerCallback = useCallback(() => {
        exportHandler(EXPORT_TYPES.TSV, models, editorModels, readOnlyColumns, getUpdateColumns, activeTab);
    }, [models, editorModels, activeTab, activeEditorModel, readOnlyColumns, getUpdateColumns]);

    const excelExportHandlerCallback = useCallback(() => {
        exportHandler(EXPORT_TYPES.EXCEL, models, editorModels, readOnlyColumns, getUpdateColumns, activeTab);
    }, [models, editorModels, activeTab, activeModel, activeEditorModel, readOnlyColumns, getUpdateColumns]);

    const onExport = {
        [EXPORT_TYPES.CSV]: csvExportHandlerCallback,
        [EXPORT_TYPES.TSV]: tsvExportHandlerCallback,
        [EXPORT_TYPES.EXCEL]: excelExportHandlerCallback,
    };

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
                <div className={'pull-right'}>
                    <ExportMenu
                        model={activeModel}
                        onExport={onExport}
                    />
                </div>
                {editableGrid}
            </div>
        </div>
    );
});
