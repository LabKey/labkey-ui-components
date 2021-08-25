import React, { ReactNode } from 'react';
import { List, Map, OrderedMap, fromJS } from 'immutable';

import { AuditBehaviorTypes, Query } from '@labkey/api';

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
    gridIdInvalidate,
    resolveErrorMessage,
    getQueryGridModel,
    LoadingSpinner,
    QueryModel,
    getStateModelId,
    EditableColumnMetadata,
    caseInsensitive,
    SampleTypeDataType,
    IEntityTypeOption,
    EntityDataType,
    IParentOption,
} from '../../..';

import { DisplayObject, EntityChoice, EntityParentType } from '../entities/models';

import {
    addEntityParentType,
    changeEntityParentType,
    EntityParentTypeSelectors,
    removeEntityParentType,
} from '../entities/EntityParentTypeSelectors';

import { SamplesSelectionProviderProps, SamplesSelectionResultProps } from './models';
import { getOriginalParentsFromSampleLineage } from './actions';

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
    parentDataTypes: List<EntityDataType>;
    combineParentTypes?: boolean;
}

type Props = OwnProps & SamplesSelectionProviderProps & SamplesSelectionResultProps;

const STORAGE_UPDATE_FIELDS = ['StoredAmount', 'Units', 'FreezeThawCount'];
const SAMPLES_EDIT_GRID_ID = 'update-samples-grid';
const SAMPLES_STORAGE_EDIT_GRID_ID = 'update-samples-storage-grid';
const SAMPLES_LINEAGE_EDIT_GRID_ID = 'update-samples-lineage-grid';

const INVENTORY_ITEM_QS = SchemaQuery.create('inventory', 'item');

enum GridTab {
    Samples,
    Storage,
    Lineage,
}

interface State {
    originalParents: Record<string, List<EntityChoice>>;
    parentTypeOptions: Map<string, List<IEntityTypeOption>>;
    entityParentsMap: Map<string, List<EntityParentType>>;
}

// Usage: export const SamplesEditableGrid = connect<any, any, any>(undefined)(SamplesSelectionProvider(SamplesEditableGridBase));
export class SamplesEditableGridBase extends React.Component<Props, State> {
    private readOnlyColumns: List<string> = undefined;

    private _hasError: boolean;

    constructor(props: Props) {
        super(props);
        this._hasError = false;

        this.state = {
            originalParents: undefined,
            parentTypeOptions: undefined,
            entityParentsMap: fromJS(
                props.parentDataTypes.reduce((map, dataType) => {
                    map[dataType.typeListingSchemaQuery.queryName] = [];
                    return map;
                }, {})
            ),
        };
    }

    componentDidMount(): void {
        this.init();
    }

    init(): void {
        dismissNotifications();
        this.initSamplesEditableGrid();
        this.initStorageEditableGrid();
        this.initLineageEditableGrid();
    }

    componentWillUnmount(): void {
        // dismiss grid error msg, retain success msg
        if (this._hasError) dismissNotifications();

        gridIdInvalidate(SAMPLES_EDIT_GRID_ID, true);
        gridIdInvalidate(SAMPLES_STORAGE_EDIT_GRID_ID, true);
        gridIdInvalidate(SAMPLES_LINEAGE_EDIT_GRID_ID, true);
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

    getSamplesEditorQueryGridModel = (): QueryGridModel => {
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

    initSamplesEditableGrid = (): void => {
        gridInit(this.getSamplesEditorQueryGridModel(), true, this);
    };

    getSchemaQuery = (): SchemaQuery => {
        const { displayQueryModel } = this.props;
        return displayQueryModel?.queryInfo?.schemaQuery;
    };

    getStorageEditorQueryGridModel = (): QueryGridModel => {
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

    initStorageEditableGrid = (): void => {
        if (this.props.canEditStorage) gridInit(this.getStorageEditorQueryGridModel(), true, this);
    };

    getLineageEditorQueryGridModel = (): QueryGridModel => {
        const { displayQueryModel, sampleLineage, sampleLineageKeys } = this.props;
        const { originalParents } = this.state;
        if (!originalParents) return undefined;

        // return quickly if we have already generated a model
        const queryModel = displayQueryModel;
        const samplesSchemaQuery = this.getSchemaQuery();
        const modelId = getStateModelId(SAMPLES_LINEAGE_EDIT_GRID_ID, samplesSchemaQuery);
        const stateModel = getQueryGridModel(modelId);
        if (stateModel) return stateModel;

        // TODO factor this out to a separate function
        // model columns should include RowId, Name, and one column for each distinct existing parent (source and/or
        // sample type) of the selected samples.
        let updatedColumns = OrderedMap<string, QueryColumn>();
        queryModel.queryInfo.columns.forEach((column, key) => {
            if (['name', 'rowid'].indexOf(key) > -1) {
                updatedColumns = updatedColumns.set(key, column);
            }
        });
        const parentColumns = {};
        let parentColIndex = 0;
        // TODO should we use EntityIdCreationModel.getParentColumns?
        Object.values(originalParents).forEach(sampleParents => {
            sampleParents.forEach(sampleParent => {
                const { schema, query } = sampleParent.type;
                const parentCol = EntityParentType.create({ index: parentColIndex, schema, query }).generateColumn(
                    sampleParent.type.entityDataType.uniqueFieldKey
                );

                if (!parentColumns[parentCol.fieldKey]) {
                    parentColumns[parentCol.fieldKey] = parentCol;
                    parentColIndex++;
                }
            });
        });
        Object.keys(parentColumns)
            .sort() // Order parent columns so sources come first before sample types, and then alphabetically ordered within the types
            .forEach(key => {
                updatedColumns = updatedColumns.set(key, parentColumns[key]);
            });

        return getStateQueryGridModel(SAMPLES_LINEAGE_EDIT_GRID_ID, samplesSchemaQuery, {
            editable: true,
            queryInfo: queryModel.queryInfo.merge({ columns: updatedColumns }) as QueryInfo,
            loader: {
                fetch: () => {
                    return new Promise(resolve => {
                        let data = EditorModel.convertQueryDataToEditorData(fromJS(sampleLineage));
                        Object.keys(originalParents).forEach(sampleId => {
                            originalParents[sampleId].forEach(sampleParent => {
                                const { schema, query } = sampleParent.type;
                                const value = List<DisplayObject>(sampleParent.gridValues);
                                const parentType = EntityParentType.create({ schema, query, value });
                                const fieldKey = parentType.generateFieldKey();
                                data = data.setIn([sampleId, fieldKey], parentType.value);
                            });
                        });

                        resolve({
                            data,
                            dataIds: List<string>(sampleLineageKeys),
                            totalRows: sampleLineageKeys.length,
                        });
                    });
                },
            },
        });
    };

    initLineageEditableGrid = async (): Promise<void> => {
        const { originalParents, parentTypeOptions } = await getOriginalParentsFromSampleLineage(
            this.props.sampleLineage
        );
        this.setState(
            () => ({ originalParents, parentTypeOptions }),
            () => {
                gridInit(this.getLineageEditorQueryGridModel(), true, this);
            }
        );
    };

    updateAllTabRows = (updateDataRows: any[]): Promise<any> => {
        const { noStorageSamples, invalidateSampleQueries, aliquots } = this.props;
        let sampleSchemaQuery: SchemaQuery = null,
            sampleRows: any[] = [],
            storageRows: any[] = [],
            lineageRows: any[] = [];
        updateDataRows.forEach(data => {
            const tabIndex = data.tabIndex;
            if (tabIndex === GridTab.Storage) {
                storageRows = data.updatedRows;
                sampleSchemaQuery = data.schemaQuery;
            } else if (tabIndex === GridTab.Lineage) {
                lineageRows = getUpdatedLineageRows(data.updatedRows, this.getLineageEditorQueryGridModel(), aliquots);
                sampleSchemaQuery = data.schemaQuery;
            } else {
                sampleRows = data.updatedRows;
                sampleSchemaQuery = data.schemaQuery;
            }
        });

        if (storageRows.length === 0 && lineageRows.length === 0 && sampleRows.length === 0) {
            return new Promise(resolve => {
                this._hasError = false;
                dismissNotifications();
                createNotification(NO_UPDATES_MESSAGE);
                resolve('No changes to be saved.');
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
                resolve('There were errors during the save.');
            });
        }

        const sampleIds = new Set();
        sampleRows.forEach(row => {
            sampleIds.add(row['RowId']);
        });
        lineageRows.forEach(row => {
            sampleIds.add(row['RowId']);
        });
        storageRows.forEach(row => {
            const sampleId = row['RowId'];
            if (noStorageSamples.indexOf(sampleId) === -1) sampleIds.add(sampleId);
        });
        const totalSamplesToUpdate = sampleIds.size;
        const noun = totalSamplesToUpdate === 1 ? 'sample' : 'samples';

        const commands = [];
        if (sampleRows.length > 0) {
            commands.push({
                command: 'update',
                schemaName: sampleSchemaQuery.schemaName,
                queryName: sampleSchemaQuery.queryName,
                rows: sampleRows,
                auditBehavior: AuditBehaviorTypes.DETAILED,
            });
        }
        if (convertedStorageData?.normalizedRows.length > 0) {
            commands.push({
                command: 'update',
                schemaName: INVENTORY_ITEM_QS.schemaName,
                queryName: INVENTORY_ITEM_QS.queryName,
                rows: convertedStorageData.normalizedRows,
                auditBehavior: AuditBehaviorTypes.DETAILED,
            });
        }
        if (lineageRows.length > 0) {
            commands.push({
                command: 'update',
                schemaName: sampleSchemaQuery.schemaName,
                queryName: sampleSchemaQuery.queryName,
                rows: lineageRows,
                auditBehavior: AuditBehaviorTypes.DETAILED,
            });
        }

        return new Promise((resolve, reject) => {
            Query.saveRows({
                commands,
                success: result => {
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
                    gridIdInvalidate(SAMPLES_LINEAGE_EDIT_GRID_ID, true);
                    dismissNotifications(); // get rid of any error notifications that have already been created

                    createNotification('Successfully updated ' + totalSamplesToUpdate + ' ' + noun + '.');

                    resolve(result);
                },
                failure: reason => {
                    this._hasError = true;
                    dismissNotifications(); // get rid of any error notifications that have already been created
                    createNotification({
                        alertClass: 'danger',
                        message: resolveErrorMessage(reason, 'sample', 'samples', 'update'),
                    });
                    resolve(reason);
                },
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

    onGridEditComplete = (): void => {
        const { onGridEditComplete } = this.props;
        if (!this._hasError) onGridEditComplete();
    };

    hasAliquots = (): boolean => {
        const { aliquots } = this.props;
        return aliquots && aliquots.length > 0;
    };

    getSamplesColumnMetadata = (tabInd: number): Map<string, EditableColumnMetadata> => {
        if (tabInd === GridTab.Storage || tabInd === GridTab.Lineage) return undefined;

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

    getSamplesUpdateColumns = (tabInd: number): List<QueryColumn> => {
        if (tabInd === GridTab.Storage || tabInd === GridTab.Lineage) return undefined;

        const { sampleTypeDomainFields } = this.props;
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

    getSelectedSamplesNoun = (): string => {
        const { aliquots } = this.props;
        const allAliquots =
            this.hasAliquots() && aliquots.length === this.getSamplesEditorQueryGridModel().dataIds.size;
        return allAliquots ? 'aliquot' : 'sample';
    };

    getReadOnlyRows = (tabInd: number): List<string> => {
        const { noStorageSamples, aliquots } = this.props;

        if (tabInd === GridTab.Storage) {
            return List<string>(noStorageSamples);
        } else if (tabInd === GridTab.Lineage) {
            return List<string>(aliquots);
        }

        return undefined;
    };

    getTabTitle = (tabInd: number): string => {
        if (tabInd === GridTab.Storage) return 'Storage Details';
        if (tabInd === GridTab.Lineage) return 'Lineage Details';
        return 'Sample Data';
    };

    addParentType = (queryName: string): void => {
        const { entityParentsMap } = this.state;
        const updatedEntityParents = addEntityParentType(queryName, entityParentsMap);
        this.setState(() => ({ entityParentsMap: updatedEntityParents }));
    };

    removeParentType = (index: number, queryName: string): void => {
        const { entityParentsMap } = this.state;
        const updatedEntityParents = removeEntityParentType(
            index,
            queryName,
            entityParentsMap,
            this.getLineageEditorQueryGridModel()
        );
        this.setState(() => ({ entityParentsMap: updatedEntityParents }));
    };

    changeParentType = (
        index: number,
        queryName: string,
        fieldName: string,
        formValue: any,
        parent: IParentOption
    ): void => {
        const { entityParentsMap } = this.state;
        const { combineParentTypes } = this.props;
        const updatedEntityParents = changeEntityParentType(
            index,
            queryName,
            parent,
            this.getLineageEditorQueryGridModel(),
            entityParentsMap,
            SampleTypeDataType,
            combineParentTypes
        );
        this.setState(() => ({ entityParentsMap: updatedEntityParents }));
    };

    getTabHeader = (tabInd: number): ReactNode => {
        const { parentDataTypes, combineParentTypes } = this.props;
        const { parentTypeOptions, entityParentsMap } = this.state;

        if (tabInd === GridTab.Lineage) {
            return (
                <>
                    <div className="top-spacing">
                        <EntityParentTypeSelectors
                            parentDataTypes={parentDataTypes}
                            parentOptionsMap={parentTypeOptions}
                            entityParentsMap={entityParentsMap}
                            combineParentTypes={combineParentTypes}
                            onAdd={this.addParentType}
                            onChange={this.changeParentType}
                            onRemove={this.removeParentType}
                        />
                    </div>
                    <hr />
                </>
            );
        }

        return null;
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
        } else {
            // add a null to the models array so that the tabIndices line up for other parts of the render,
            // this can be removed soon once LKB supports freezer management
            models.push(null);
        }

        const lineageGrid = this.getLineageEditorQueryGridModel();
        if (!lineageGrid || !lineageGrid.isLoaded) return <LoadingSpinner />;
        models.push(lineageGrid);

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
                getTabHeader={this.getTabHeader}
            />
        );
    }
}

function getUpdatedLineageRows(
    lineageRows: Record<string, any>[],
    originalModel: QueryGridModel,
    aliquots: any[]
): Record<string, any>[] {
    const updatedLineageRows = [];

    // iterate through all of the lineage rows to find the ones that have any edit from the initial data row,
    // also remove the aliquot rows from the lineageRows array
    lineageRows?.forEach(row => {
        const rowId = caseInsensitive(row, 'RowId');
        if (aliquots.indexOf(rowId) === -1) {
            // compare each row value looking for any that are different from the original value
            let hasUpdate = false;
            Object.keys(row).every(key => {
                const updatedVal = row[key];
                let originalVal = originalModel.data.get('' + rowId).get(key);
                if (List.isList(originalVal)) {
                    originalVal = originalVal?.map(parentRow => parentRow.displayValue).join(', ');
                }

                if (originalVal !== updatedVal) {
                    hasUpdate = true;
                    return false;
                }
                return true;
            });

            if (hasUpdate) updatedLineageRows.push(row);
        }
    });

    return updatedLineageRows;
}
