import React from 'react';
import { List, Map, OrderedMap } from 'immutable';

import { AuditBehaviorTypes } from '@labkey/api';

import {
    User,
    EditableGridPanelForUpdate,
    SchemaQuery,
    getUniqueIdColumnMetadata,
    QueryColumn,
    QueryGridModel,
    getStateQueryGridModel,
    EditableGridLoaderFromSelection,
    gridInit,
    QueryInfo,
    getSelectedData,
    EditorModel,
    dismissNotifications,
    createNotification,
    NO_UPDATES_MESSAGE,
    queryGridInvalidate,
    invalidateLineageResults,
    schemaGridInvalidate,
    gridIdInvalidate,
    resolveErrorMessage,
    getQueryGridModel,
    updateRows,
    LoadingSpinner,
    QueryModel,
} from '../../..';

import { SamplesSelectionProviderProps, SamplesSelectionResultProps } from './models';

interface OwnProps {
    displayQueryModel: QueryModel;
    onGridEditCancel: () => any;
    onGridEditComplete: () => any;
    selectionData: Map<string, any>;
    user: User;
    editableGridUpdateData?: any;
    editableGridDataForSelection?: Map<string, any>;
    editableGridDataIdsForSelection?: List<any>;
    canEditStorage: boolean;
    samplesGridRequiredColumns: string[];
    samplesGridOmittedColumns?: List<string>;
    getConvertedStorageUpdateData?: (
        storageRows: any[],
        sampleItems: {},
        sampleTypeUnit: string,
        noStorageSamples: any[],
        selection: List<any>
    ) => any;
    invalidateSampleQueries?: (schemaQuery: SchemaQuery) => void;
}

type Props = OwnProps & SamplesSelectionProviderProps & SamplesSelectionResultProps;

const STORAGE_UPDATE_FIELDS = ['StoredAmount', 'Units', 'FreezeThawCount'];
const SAMPLES_EDIT_GRID_ID = 'update-samples-grid';
const SAMPLES_STORAGE_EDIT_GRID_ID = 'update-samples-storage-grid';

const INVENTORY_ITEM_QS = SchemaQuery.create('inventory', 'item');

enum GridTab {
    Samples,
    Storage,
}

// Usage:
// export const SamplesEditableGrid = connect<any, any, any>(undefined)(SamplesSelectionProvider(SamplesEditableGridBase));
export class SamplesEditableGridBase extends React.Component<Props, any> {
    private readOnlyColumns: List<string> = undefined;

    private _hasError: boolean;

    constructor(props) {
        super(props);

        this._hasError = false;
    }

    componentDidMount(): void {
        this.init();
    }

    init() {
        dismissNotifications();
        this.initSamplesEditableGrid();
        this.initStorageEditableGrid();
    }

    componentWillUnmount() {
        if (this._hasError)
            // dismiss grid error msg, retain success msg
            dismissNotifications();

        gridIdInvalidate(SAMPLES_EDIT_GRID_ID, true);
        gridIdInvalidate(SAMPLES_STORAGE_EDIT_GRID_ID, true);
    }

    getReadOnlyColumns(): List<string> {
        const { displayQueryModel } = this.props;

        if (!this.readOnlyColumns) {
            this.readOnlyColumns = List<string>([
                'Name',
                ...displayQueryModel.queryInfo
                    .getUniqueIdColumns()
                    .map(column => column.fieldKey)
                    .toArray(),
            ]);
        }
        return this.readOnlyColumns;
    }

    getSamplesGridRequiredColumns(): List<string> {
        const { displayQueryModel, samplesGridRequiredColumns } = this.props;
        return List<string>([
            ...samplesGridRequiredColumns,
            ...displayQueryModel.queryInfo
                .getUniqueIdColumns()
                .map(column => column.fieldKey)
                .toArray(),
        ]);
    }

    getStorageGridRequiredColumns(): List<string> {
        return List<string>(STORAGE_UPDATE_FIELDS);
    }

    getSamplesEditorQueryGridModel = () => {
        const {
            editableGridUpdateData,
            editableGridDataForSelection,
            editableGridDataIdsForSelection,
            samplesGridOmittedColumns,
        } = this.props;

        const { displayQueryModel } = this.props;
        const samplesSchemaQuery = this.getSchemaQuery();

        const editModel = getStateQueryGridModel(SAMPLES_EDIT_GRID_ID, samplesSchemaQuery, {
            editable: true,
            queryInfo: displayQueryModel.queryInfo,
            loader: new EditableGridLoaderFromSelection(
                editableGridUpdateData,
                editableGridDataForSelection,
                editableGridDataIdsForSelection ?? List(Array.from(displayQueryModel.selections))
            ),
            requiredColumns: this.getSamplesGridRequiredColumns(),
            omittedColumns: samplesGridOmittedColumns ? samplesGridOmittedColumns : List<string>(),
            sorts: displayQueryModel.sortString,
        });
        return getQueryGridModel(editModel.getId()) || editModel;
    };

    initSamplesEditableGrid = () => {
        gridInit(this.getSamplesEditorQueryGridModel(), true, this);
    };

    getSchemaQuery = () => {
        const { displayQueryModel } = this.props;
        return displayQueryModel?.queryInfo?.schemaQuery;
    };

    getStorageEditorQueryGridModel = () => {
        const { displayQueryModel, editableGridDataIdsForSelection } = this.props;

        const queryModel = displayQueryModel;

        const samplesSchemaQuery = this.getSchemaQuery();
        let updatedColumns = OrderedMap<string, QueryColumn>();
        queryModel.queryInfo.columns.forEach((column, key) => {
            if (['name', 'rowid'].indexOf(key) > -1) updatedColumns = updatedColumns.set(key, column);
            else if (STORAGE_UPDATE_FIELDS.indexOf(column.fieldKey) > -1) {
                const updatedCol = column.merge({
                    shownInUpdateView: true,
                    userEditable: true,
                }) as QueryColumn;
                updatedColumns = updatedColumns.set(key, updatedCol);
            }
        });

        const editModel = getStateQueryGridModel(SAMPLES_STORAGE_EDIT_GRID_ID, samplesSchemaQuery, {
            editable: true,
            queryInfo: queryModel.queryInfo.merge({ columns: updatedColumns }).asImmutable() as QueryInfo,
            requiredColumns: this.getStorageGridRequiredColumns(),
            loader: {
                fetch: () => {
                    return new Promise((resolve, reject) => {
                        const { schemaName, queryName, queryParameters, columnString } = queryModel;
                        const sorts = queryModel.sorts.join(',');
                        const selectedIds = editableGridDataIdsForSelection
                            ? editableGridDataIdsForSelection.toArray()
                            : [...queryModel.selections];
                        return getSelectedData(schemaName, queryName, selectedIds, columnString, sorts, queryParameters)
                            .then(response => {
                                const { data, dataIds, totalRows } = response;
                                let convertedData = OrderedMap<string, any>();
                                data.forEach((d, key) => {
                                    let updatedRow = d;
                                    if (d) {
                                        const storedAmount = d.getIn(['StoredAmount', 'value']);
                                        if (storedAmount != null) {
                                            updatedRow = updatedRow.set(
                                                'StoredAmount',
                                                d.get('StoredAmount').set('value', storedAmount)
                                            );
                                        }
                                        convertedData = convertedData.set(key, updatedRow);
                                    }
                                });
                                resolve({
                                    data: EditorModel.convertQueryDataToEditorData(convertedData),
                                    dataIds,
                                    totalRows,
                                });
                            })
                            .catch(error => {
                                reject({
                                    error,
                                });
                            });
                    });
                },
            },
        });
        return getQueryGridModel(editModel.getId()) || editModel;
    };

    initStorageEditableGrid = () => {
        if (this.props.canEditStorage) gridInit(this.getStorageEditorQueryGridModel(), true, this);
    };

    updateAllTabRows = (updateDataRows: any[]): Promise<void> => {
        const { noStorageSamples, invalidateSampleQueries } = this.props;
        let sampleRows: any[] = [],
            sampleSchemaQuery: SchemaQuery = null,
            storageRows: any[] = [];
        updateDataRows.forEach(data => {
            const tabIndex = data.tabIndex;
            if (tabIndex === GridTab.Storage) {
                storageRows = data.updatedRows;
                sampleSchemaQuery = data.schemaQuery;
            } else {
                sampleRows = data.updatedRows;
                sampleSchemaQuery = data.schemaQuery;
            }
        });

        if (storageRows.length === 0 && sampleRows.length === 0) {
            return new Promise(resolve => {
                this._hasError = false;
                dismissNotifications();
                createNotification(NO_UPDATES_MESSAGE);
                resolve();
            });
        }

        const convertedStorageData = this.getStorageUpdateData(storageRows);
        if (convertedStorageData?.errors) {
            return new Promise(resolve => {
                this._hasError = true;
                dismissNotifications(); // get rid of any error notifications that have already been created
                createNotification({
                    alertClass: 'danger',
                    message: convertedStorageData?.errors.join('\n'),
                });
                resolve();
            });
        }

        const sampleIds = new Set();
        sampleRows.forEach(row => {
            sampleIds.add(row['RowId']);
        });
        storageRows.forEach(row => {
            const sampleId = row['RowId'];
            if (noStorageSamples.indexOf(sampleId) === -1) sampleIds.add(sampleId);
        });
        const totalSamplesToUpdate = sampleIds.size;
        const noun = totalSamplesToUpdate === 1 ? 'sample' : 'samples';

        const updatePromises = [];
        if (sampleRows.length > 0) {
            updatePromises.push(
                updateRows({
                    schemaQuery: sampleSchemaQuery,
                    rows: sampleRows,
                    auditBehavior: AuditBehaviorTypes.DETAILED,
                })
            );
        }
        if (convertedStorageData?.normalizedRows.length > 0) {
            updatePromises.push(
                updateRows({
                    schemaQuery: INVENTORY_ITEM_QS,
                    rows: convertedStorageData.normalizedRows,
                    auditBehavior: AuditBehaviorTypes.DETAILED,
                })
            );
        }

        return Promise.all(updatePromises)
            .then(result => {
                this._hasError = false;
                if (sampleSchemaQuery) {
                    if (invalidateSampleQueries) {
                        invalidateSampleQueries(sampleSchemaQuery);
                    } else {
                        queryGridInvalidate(sampleSchemaQuery);
                        invalidateLineageResults();
                    }
                }

                if (convertedStorageData?.normalizedRows.length > 0) queryGridInvalidate(INVENTORY_ITEM_QS);

                gridIdInvalidate(SAMPLES_EDIT_GRID_ID, true);
                gridIdInvalidate(SAMPLES_STORAGE_EDIT_GRID_ID, true);
                dismissNotifications(); // get rid of any error notifications that have already been created
                createNotification('Successfully updated ' + totalSamplesToUpdate + ' ' + noun);
            })
            .catch(reason => {
                this._hasError = true;
                dismissNotifications(); // get rid of any error notifications that have already been created
                createNotification({
                    alertClass: 'danger',
                    message: resolveErrorMessage(reason, noun, 'samples', 'update'),
                });
            });
    };

    getStorageUpdateData(storageRows: any[]) {
        const {
            canEditStorage,
            sampleItems,
            sampleTypeDomainFields,
            noStorageSamples,
            selection,
            getConvertedStorageUpdateData,
        } = this.props;
        if (!canEditStorage || storageRows.length === 0 || !getConvertedStorageUpdateData) return null;

        const sampleTypeUnit = sampleTypeDomainFields.metricUnit;

        // the current implementation of getConvertedStorageUpdateData uses @labkey/freezermanager, so it cannot be moved to ui-components
        return getConvertedStorageUpdateData(storageRows, sampleItems, sampleTypeUnit, noStorageSamples, selection);
    }

    onGridEditComplete = () => {
        const { onGridEditComplete } = this.props;
        if (!this._hasError) onGridEditComplete();
    };

    hasAliquots = () => {
        const { aliquots } = this.props;
        return aliquots && aliquots.length > 0;
    };

    getSamplesColumnMetadata = (tabInd: number) => {
        if (tabInd === GridTab.Storage) return undefined;

        const { aliquots, sampleTypeDomainFields } = this.props;

        const queryGridModel = this.getSamplesEditorQueryGridModel();
        // always allow description field to be editable, even for aliquots
        let columnMetadata = getUniqueIdColumnMetadata(queryGridModel.queryInfo);

        const allSamples = !aliquots || aliquots.length === 0;
        if (allSamples) return columnMetadata.asImmutable();

        const allAliquots = this.hasAliquots() && aliquots.length === queryGridModel.dataIds.size;
        sampleTypeDomainFields.aliquotFields.forEach(field => {
            columnMetadata = columnMetadata.set(field, {
                isReadOnlyCell: key => {
                    return aliquots.indexOf(key) === -1;
                },
            });
        });

        sampleTypeDomainFields.metaFields.forEach(field => {
            columnMetadata = columnMetadata.set(field, {
                isReadOnlyCell: key => {
                    return allAliquots || aliquots.indexOf(key) > -1;
                },
            });
        });

        return columnMetadata.asImmutable();
    };

    getSamplesUpdateColumns = (tabInd: number) => {
        if (tabInd === GridTab.Storage) return undefined;

        const { aliquots, sampleTypeDomainFields } = this.props;
        const allColumns: List<QueryColumn> = this.getSamplesEditorQueryGridModel().getUpdateColumns(
            this.getReadOnlyColumns()
        );

        // remove aliquot specific fields if all selected are samples
        const keepAliquotFields = this.hasAliquots();
        if (keepAliquotFields) return allColumns;

        let updatedColumns = List<QueryColumn>();
        allColumns.forEach(col => {
            if (sampleTypeDomainFields.aliquotFields.indexOf(col.fieldKey.toLowerCase()) === -1)
                updatedColumns = updatedColumns.push(col);
        });

        return updatedColumns.asImmutable();
    };

    getSelectedSamplesNoun = () => {
        const { aliquots } = this.props;
        const allAliquots =
            this.hasAliquots() && aliquots.length === this.getSamplesEditorQueryGridModel().dataIds.size;
        return allAliquots ? 'aliquot' : 'sample';
    };

    getReadOnlyRows = (tabInd: number) => {
        const { noStorageSamples } = this.props;
        if (!tabInd || tabInd === GridTab.Samples) return undefined;

        return List<string>(noStorageSamples);
    };

    getTabTitle = (tabInd: number) => {
        return tabInd === GridTab.Storage ? 'Storage Details' : 'Sample Data';
    };

    render() {
        const { selectionData, onGridEditCancel, canEditStorage } = this.props;

        const samplesGrid = this.getSamplesEditorQueryGridModel();
        if (!samplesGrid || !samplesGrid.isLoaded) return <LoadingSpinner />;

        const models = [samplesGrid];
        if (canEditStorage) {
            const storageGrid = this.getStorageEditorQueryGridModel();
            if (!storageGrid || !storageGrid.isLoaded) return <LoadingSpinner />;

            models.push(storageGrid);
        }

        return (
            <EditableGridPanelForUpdate
                model={List<QueryGridModel>(models)}
                selectionData={selectionData}
                updateAllTabRows={this.updateAllTabRows}
                onCancel={onGridEditCancel}
                onComplete={this.onGridEditComplete}
                idField="RowId"
                singularNoun={this.getSelectedSamplesNoun()}
                pluralNoun={this.getSelectedSamplesNoun() + 's'}
                readOnlyColumns={this.getReadOnlyColumns()}
                getReadOnlyRows={this.getReadOnlyRows}
                getTabTitle={this.getTabTitle}
                getColumnMetadata={this.getSamplesColumnMetadata}
                getUpdateColumns={this.getSamplesUpdateColumns}
            />
        );
    }
}
