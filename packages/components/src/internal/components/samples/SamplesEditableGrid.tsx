import React, { ReactNode } from 'react';
import { fromJS, List, Map, OrderedMap } from 'immutable';

import { AuditBehaviorTypes, Query, Utils } from '@labkey/api';

import {
    caseInsensitive,
    createNotification,
    dismissNotifications,
    EditableColumnMetadata,
    EditableGridLoaderFromSelection,
    EditableGridPanelForUpdate,
    EditorModel,
    EntityDataType,
    getQueryGridModel,
    getSelectedData,
    getStateModelId,
    getStateQueryGridModel,
    getUniqueIdColumnMetadata,
    gridIdInvalidate,
    gridInit,
    IEntityTypeOption,
    invalidateLineageResults,
    IParentOption,
    LoadingSpinner,
    naturalSort,
    NO_UPDATES_MESSAGE,
    QueryColumn,
    queryGridInvalidate,
    QueryGridModel,
    QueryInfo,
    QueryModel,
    resolveErrorMessage,
    SampleTypeDataType,
    SchemaQuery,
    User,
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
            notEditableSamples,
        } = this.props;

        const { displayQueryModel } = this.props;
        const samplesSchemaQuery = this.getSchemaQuery();

        const editModel = getStateQueryGridModel(SAMPLES_EDIT_GRID_ID, samplesSchemaQuery, {
            editable: true,
            queryInfo: displayQueryModel.queryInfo,
            loader: new EditableGridLoaderFromSelection(
                editableGridUpdateData,
                editableGridDataForSelection,
                editableGridDataIdsForSelection ?? List(Array.from(displayQueryModel.selections)),
                notEditableSamples
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

        // return global state model if we have already generated it
        const samplesSchemaQuery = this.getSchemaQuery();
        const modelId = getStateModelId(SAMPLES_LINEAGE_EDIT_GRID_ID, samplesSchemaQuery);
        const stateModel = getQueryGridModel(modelId);
        if (stateModel) {
            return stateModel;
        } else {
            return createLineageEditorQueryGridModel(
                displayQueryModel,
                samplesSchemaQuery,
                originalParents,
                sampleLineageKeys,
                sampleLineage
            );
        }
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
        const { notEditableSamples, noLineageUpdateSamples, noStorageUpdateSamples, invalidateSampleQueries, aliquots } = this.props;
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

        // remove all rows for samples that are not editable.
        sampleRows = sampleRows.filter(sampleRow => {
            const rowId = caseInsensitive(sampleRow, 'RowId');
            return notEditableSamples.indexOf(rowId) < 0;
        })

        // combine sampleRows and lineageRows so that only one update command is used, i.e. so that we only get
        // one audit entry for the update of a given sample
        if (lineageRows.length > 0) {
            const sampleRowIdIndexMap = sampleRows.reduce((map, row, index) => {
                map[caseInsensitive(row, 'RowId')] = index;
                return map;
            }, {});
            lineageRows.forEach(lineageRow => {
                const rowId = caseInsensitive(lineageRow, 'RowId');
                // skip updates that aren't allowed.
                if (noLineageUpdateSamples.indexOf(rowId) < 0) {
                    if (sampleRowIdIndexMap[rowId] !== undefined) {
                        // merge in sample metadata row data with lineage row data for the same RowId
                        sampleRows[sampleRowIdIndexMap[rowId]] = {
                            ...sampleRows[sampleRowIdIndexMap[rowId]],
                            ...lineageRow,
                        };
                    } else {
                        sampleRows.push(lineageRow);
                    }
                }
            });
        }

        if (storageRows.length === 0 && sampleRows.length === 0) {
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
        storageRows.forEach(row => {
            const sampleId = row['RowId'];
            if (noStorageUpdateSamples.indexOf(sampleId) === -1) sampleIds.add(sampleId);
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
            noStorageUpdateSamples,
            selection,
            getConvertedStorageUpdateData,
        } = this.props;
        if (!canEditStorage || storageRows.length === 0 || !getConvertedStorageUpdateData) return null;

        const sampleTypeUnit = sampleTypeDomainFields.metricUnit;

        // the current implementation of getConvertedStorageUpdateData uses @labkey/freezermanager, so it cannot be moved to ui-components
        return getConvertedStorageUpdateData(storageRows, sampleItems, sampleTypeUnit, noStorageUpdateSamples, selection);
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
        const { notEditableSamples, noStorageUpdateSamples, noLineageUpdateSamples } = this.props;

        if (tabInd === GridTab.Storage) {
            return List<string>(noStorageUpdateSamples);
        } else if (tabInd === GridTab.Lineage) {
            return List<string>(noLineageUpdateSamples);
        } else {
            return List<string>(notEditableSamples);
        }
    };

    getTabTitle = (tabInd: number): string => {
        if (tabInd === GridTab.Storage) return 'Storage Details';
        if (tabInd === GridTab.Lineage) return 'Lineage Details';
        return 'Sample Data';
    };

    addParentType = (queryName: string): void => {
        const { entityParentsMap } = this.state;
        this.setState({ entityParentsMap: addEntityParentType(queryName, entityParentsMap) });
    };

    removeParentType = (index: number, queryName: string): void => {
        const { entityParentsMap } = this.state;
        this.setState({
            entityParentsMap: removeEntityParentType(
                index,
                queryName,
                entityParentsMap,
                this.getLineageEditorQueryGridModel()
            ),
        });
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
        this.setState({
            entityParentsMap: changeEntityParentType(
                index,
                queryName,
                parent,
                this.getLineageEditorQueryGridModel(),
                entityParentsMap,
                SampleTypeDataType,
                combineParentTypes
            ),
        });
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
                    <div className="sample-status-warning">Aliquots and samples with a status that prevents updating of lineage are not editable here.</div>
                    <hr />
                </>
            );
        } else if (tabInd === GridTab.Storage) {
            return <div className="top-spacing sample-status-warning">Samples that are not currently in storage or have a status that prevents updating of storage data are not editable here.</div>
        } else {
            return <div className="top-spacing sample-status-warning">Samples that have a status that prevents updating of data are not editable here.</div>
        }
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

// exported for jest testing
export function getUpdatedLineageRows(
    lineageRows: Array<Record<string, any>>,
    originalModel: QueryGridModel,
    aliquots: any[]
): Array<Record<string, any>> {
    const updatedLineageRows = [];

    // iterate through all of the lineage rows to find the ones that have any edit from the initial data row,
    // also remove the aliquot rows from the lineageRows array
    lineageRows?.forEach(row => {
        const rowId = caseInsensitive(row, 'RowId');
        if (aliquots.indexOf(rowId) === -1) {
            // compare each row value looking for any that are different from the original value
            let hasUpdate = false;
            Object.keys(row).every(key => {
                const updatedVal = Utils.isString(row[key])
                    ? row[key].split(', ').sort(naturalSort).join(', ')
                    : row[key];
                let originalVal = originalModel.data.get('' + rowId).get(key);
                if (List.isList(originalVal)) {
                    originalVal = originalVal
                        ?.map(parentRow => parentRow.displayValue)
                        .sort(naturalSort)
                        .join(', ');
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

function createLineageEditorQueryGridModel(
    displayQueryModel: QueryModel,
    schemaQuery: SchemaQuery,
    originalParents: Record<string, List<EntityChoice>>,
    sampleLineageKeys: string[],
    sampleLineage: Record<string, any>
): QueryGridModel {
    const updatedColumns = getLineageEditorUpdateColumns(displayQueryModel, originalParents);

    return getStateQueryGridModel(SAMPLES_LINEAGE_EDIT_GRID_ID, schemaQuery, {
        editable: true,
        queryInfo: displayQueryModel.queryInfo.merge({ columns: updatedColumns }) as QueryInfo,
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
}

// exported for jest testing
export function getLineageEditorUpdateColumns(
    displayQueryModel: QueryModel,
    originalParents: Record<string, List<EntityChoice>>
): OrderedMap<string, QueryColumn> {
    // model columns should include RowId, Name, and one column for each distinct existing parent (source and/or
    // sample type) of the selected samples.
    let updatedColumns = OrderedMap<string, QueryColumn>();
    displayQueryModel.queryInfo.columns.forEach((column, key) => {
        if (['name', 'rowid'].indexOf(key) > -1) {
            updatedColumns = updatedColumns.set(key, column);
        }
    });
    const parentColumns = {};
    let parentColIndex = 0;
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

    return updatedColumns;
}
