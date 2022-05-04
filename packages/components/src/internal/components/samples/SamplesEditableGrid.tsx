import React, { ReactNode } from 'react';
import { fromJS, List, Map, OrderedMap } from 'immutable';

import { AuditBehaviorTypes, Query, Utils } from '@labkey/api';

import {
    App,
    caseInsensitive,
    createNotification,
    deleteRows,
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
    SampleStateType,
    SampleTypeDataType,
    SchemaQuery,
    SCHEMAS,
    User,
} from '../../..';

import { DisplayObject, EntityChoice, EntityParentType } from '../entities/models';

import {
    addEntityParentType,
    changeEntityParentType,
    EntityParentTypeSelectors,
    removeEntityParentType,
} from '../entities/EntityParentTypeSelectors';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { SamplesSelectionProviderProps, SamplesSelectionResultProps } from './models';
import { getOriginalParentsFromSampleLineage } from './actions';
import { SamplesSelectionProvider } from './SamplesSelectionContextProvider';
import { DiscardConsumedSamplesModal } from './DiscardConsumedSamplesModal';
import { SAMPLE_STATE_COLUMN_NAME } from './constants';
import { SampleStatusLegend } from './SampleStatusLegend';

export interface SamplesEditableGridProps {
    api?: ComponentsAPIWrapper;
    displayQueryModel: QueryModel;
    onGridEditCancel: () => any;
    onGridEditComplete: () => any;
    selectionData: Map<string, any>;
    user: User;
    editableGridUpdateData?: any;
    editableGridDataForSelection?: Map<string, any>;
    editableGridDataIdsForSelection?: List<any>;
    samplesGridRequiredColumns?: string[];
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

type Props = SamplesEditableGridProps & SamplesSelectionProviderProps & SamplesSelectionResultProps;

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
    pendingUpdateDataRows: any[];
    showDiscardDialog: boolean;
    discardConsumed: boolean;
    discardSamplesComment: string;
    discardSamplesCount: number;
    totalEditCount: number;
    consumedStatusIds: number[];
    includedTabs: GridTab[];
}

class SamplesEditableGridBase extends React.Component<Props, State> {
    private readOnlyColumns: List<string> = undefined;

    private _hasError: boolean;

    static defaultProps = {
        samplesGridRequiredColumns: ['description'],
        api: getDefaultAPIWrapper(),
    };

    constructor(props: Props) {
        super(props);
        this._hasError = false;

        const includedTabs = [];
        if (props.determineSampleData) includedTabs.push(GridTab.Samples);
        if (props.determineStorage) includedTabs.push(GridTab.Storage);
        if (props.determineLineage) includedTabs.push(GridTab.Lineage);
        this.state = {
            originalParents: undefined,
            parentTypeOptions: undefined,
            entityParentsMap: fromJS(
                props.parentDataTypes.reduce((map, dataType) => {
                    map[dataType.typeListingSchemaQuery.queryName] = [];
                    return map;
                }, {})
            ),
            pendingUpdateDataRows: undefined,
            showDiscardDialog: false,
            discardConsumed: true,
            discardSamplesComment: undefined,
            discardSamplesCount: undefined,
            totalEditCount: undefined,
            consumedStatusIds: undefined,
            includedTabs,
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

        this.props.api.samples
            .getSampleStatuses()
            .then(statuses => {
                const consumedStatusIds = [];
                statuses.forEach(status => {
                    if (status.stateType == SampleStateType.Consumed) consumedStatusIds.push(status.rowId);
                });
                this.setState({
                    consumedStatusIds,
                });
            })
            .catch(() => {
                this._hasError = true;
                createNotification({
                    alertClass: 'danger',
                    message:
                        'Error loading sample statuses. If you want to discard any samples being updated to a Consumed status, you will have to do that separately.',
                });
            });
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
            sampleTypeDomainFields,
            aliquots,
        } = this.props;

        const { displayQueryModel } = this.props;
        const samplesSchemaQuery = this.getSchemaQuery();

        const allAliquots = this.hasAliquots() && aliquots.length === displayQueryModel.selections.size;
        const editModel = getStateQueryGridModel(SAMPLES_EDIT_GRID_ID, samplesSchemaQuery, {
            editable: true,
            queryInfo: displayQueryModel.queryInfo,
            loader: new EditableGridLoaderFromSelection(
                editableGridUpdateData,
                editableGridDataForSelection,
                editableGridDataIdsForSelection ?? List(Array.from(displayQueryModel.selections)),
                allAliquots ? [] : aliquots,
                allAliquots ? undefined : sampleTypeDomainFields.metaFields
            ),
            requiredColumns: this.getSamplesGridRequiredColumns(),
            omittedColumns: samplesGridOmittedColumns ? samplesGridOmittedColumns : List<string>(),
            sorts: displayQueryModel.sortString,
        });
        return getQueryGridModel(editModel.getId()) || editModel;
    };

    initSamplesEditableGrid = (): void => {
        if (this.props.determineSampleData) {
            gridInit(this.getSamplesEditorQueryGridModel(), true, this);
        }
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
        if (this.props.determineStorage) {
            gridInit(this.getStorageEditorQueryGridModel(), true, this);
        }
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
        const { determineLineage, parentDataTypes } = this.props;
        if (determineLineage) {
            const { originalParents, parentTypeOptions } = await getOriginalParentsFromSampleLineage(this.props.sampleLineage, parentDataTypes.toArray());
            this.setState(
                () => ({ originalParents, parentTypeOptions }),
                () => {
                    gridInit(this.getLineageEditorQueryGridModel(), true, this);
                }
            );
        }
    };

    updateAllTabRows = (updateDataRows: any[], skipConfirmDiscard?: boolean): Promise<any> => {
        const { aliquots, sampleItems, noStorageSamples, invalidateSampleQueries } = this.props;
        const { discardConsumed, discardSamplesComment, consumedStatusIds, includedTabs } = this.state;

        let sampleSchemaQuery: SchemaQuery = null,
            sampleRows: any[] = [],
            storageRows: any[] = [],
            lineageRows: any[] = [],
            discardStorageRows: any[] = [];
        updateDataRows.forEach(data => {
            const tabIndex = data.tabIndex;
            if (includedTabs[tabIndex] === GridTab.Storage) {
                storageRows = data.updatedRows;
                sampleSchemaQuery = data.schemaQuery;
            } else if (includedTabs[tabIndex] === GridTab.Lineage) {
                lineageRows = getUpdatedLineageRows(data.updatedRows, this.getLineageEditorQueryGridModel(), aliquots);
                sampleSchemaQuery = data.schemaQuery;
            } else {
                sampleRows = data.updatedRows;
                sampleSchemaQuery = data.schemaQuery;
                if (sampleItems) {
                    sampleRows.forEach(row => {
                        if (consumedStatusIds.indexOf(caseInsensitive(row, 'sampleState')) > -1) {
                            const sampleId = caseInsensitive(row, 'RowId');
                            const existingStorageItem = sampleItems[sampleId];
                            if (existingStorageItem) {
                                discardStorageRows.push({
                                    rowId: existingStorageItem.rowId,
                                });
                            }
                        }
                    });
                }
            }
        });

        // combine sampleRows and lineageRows so that only one update command is used, i.e. so that we only get
        // one audit entry for the update of a given sample
        if (lineageRows.length > 0) {
            const sampleRowIdIndexMap = sampleRows.reduce((map, row, index) => {
                map[caseInsensitive(row, 'RowId')] = index;
                return map;
            }, {});
            lineageRows.forEach(lineageRow => {
                const rowId = caseInsensitive(lineageRow, 'RowId');
                if (sampleRowIdIndexMap[rowId] !== undefined) {
                    // merge in sample metadata row data with lineage row data for the same RowId
                    sampleRows[sampleRowIdIndexMap[rowId]] = {
                        ...sampleRows[sampleRowIdIndexMap[rowId]],
                        ...lineageRow,
                    };
                } else {
                    sampleRows.push(lineageRow);
                }
            });
        }

        const sampleIds = new Set();
        sampleRows.forEach(row => {
            const sampleId = caseInsensitive(row, 'RowId');
            sampleIds.add(sampleId);
        });
        storageRows.forEach(row => {
            const sampleId = caseInsensitive(row, 'RowId');
            if (noStorageSamples.indexOf(sampleId) === -1) sampleIds.add(sampleId);
        });
        const totalSamplesToUpdate = sampleIds.size;
        const noun = totalSamplesToUpdate === 1 ? 'sample' : 'samples';

        if (!skipConfirmDiscard && App.isFreezerManagementEnabled() && discardStorageRows.length > 0) {
            return new Promise(resolve => {
                this.setState({
                    pendingUpdateDataRows: updateDataRows,
                    showDiscardDialog: App.isFreezerManagementEnabled(),
                    discardSamplesCount: discardStorageRows.length,
                    totalEditCount: totalSamplesToUpdate,
                });
                resolve(false);
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
                success: async result => {
                    this._hasError = false;
                    let discardSuccessMsg = '';
                    const doDiscard = discardStorageRows?.length > 0 && discardConsumed;

                    if (doDiscard) {
                        try {
                            await deleteRows({
                                schemaQuery: SCHEMAS.INVENTORY.ITEMS,
                                rows: discardStorageRows,
                                auditBehavior: AuditBehaviorTypes.DETAILED,
                                auditUserComment: discardSamplesComment,
                            });
                            discardSuccessMsg =
                                ' and discarded ' +
                                discardStorageRows.length +
                                (discardStorageRows.length > 1 ? ' samples' : ' sample') +
                                ' from storage';
                        } catch (error) {
                            console.error(error);
                            this._hasError = true;
                            dismissNotifications();
                            createNotification({
                                alertClass: 'danger',
                                message: resolveErrorMessage(error, 'sample', 'samples', 'discard'),
                            });
                            resolve(error);
                        }
                    }

                    if (sampleSchemaQuery) {
                        if (invalidateSampleQueries) {
                            invalidateSampleQueries(sampleSchemaQuery);
                        } else {
                            queryGridInvalidate(sampleSchemaQuery);
                            invalidateLineageResults();
                        }
                    }

                    if (convertedStorageData?.normalizedRows.length > 0 || doDiscard)
                        queryGridInvalidate(INVENTORY_ITEM_QS);

                    gridIdInvalidate(SAMPLES_EDIT_GRID_ID, true);
                    gridIdInvalidate(SAMPLES_STORAGE_EDIT_GRID_ID, true);
                    gridIdInvalidate(SAMPLES_LINEAGE_EDIT_GRID_ID, true);
                    dismissNotifications(); // get rid of any error notifications that have already been created

                    createNotification(
                        'Successfully updated ' + totalSamplesToUpdate + ' ' + noun + discardSuccessMsg + '.'
                    );

                    this.onGridEditComplete();

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
        const { sampleItems, sampleTypeDomainFields, noStorageSamples, selection, getConvertedStorageUpdateData } =
            this.props;
        if (storageRows.length === 0 || !getConvertedStorageUpdateData) return null;

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
        if (this.getCurrentTab(tabInd) !== GridTab.Samples) return undefined;

        const { aliquots, sampleTypeDomainFields } = this.props;
        const queryGridModel = this.getSamplesEditorQueryGridModel();
        let columnMetadata = getUniqueIdColumnMetadata(queryGridModel.queryInfo);
        columnMetadata = columnMetadata.set(SAMPLE_STATE_COLUMN_NAME, {
            hideTitleTooltip: true,
            toolTip: <SampleStatusLegend />,
            popoverClassName: 'label-help-arrow-left',
        });

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
        const { includedTabs } = this.state;

        if (this.getCurrentTab(tabInd) !== GridTab.Samples) return undefined;

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
        const { aliquots, noStorageSamples } = this.props;
        const { includedTabs } = this.state;

        if (includedTabs[tabInd] === GridTab.Storage) {
            return List<string>(noStorageSamples);
        } else if (includedTabs[tabInd] === GridTab.Lineage) {
            return List<string>(aliquots);
        } else {
            return undefined;
        }
    };

    getTabTitle = (tabInd: number): string => {
        const { includedTabs } = this.state;

        if (includedTabs[tabInd] === GridTab.Storage) return 'Storage Details';
        if (includedTabs[tabInd] === GridTab.Lineage) return 'Lineage Details';
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

    getCurrentTab = (tabInd: number): number => {
        const { includedTabs } = this.state;
        return tabInd === undefined ? includedTabs[0] : includedTabs[tabInd];
    };

    getTabHeader = (tabInd: number): ReactNode => {
        const { parentDataTypes, combineParentTypes } = this.props;
        const { parentTypeOptions, entityParentsMap } = this.state;

        const currentTab = this.getCurrentTab(tabInd);

        if (currentTab === GridTab.Lineage) {
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
                    <div className="sample-status-warning">Lineage for aliquots cannot be changed.</div>
                    <hr />
                </>
            );
        } else if (currentTab === GridTab.Storage) {
            return (
                <div className="top-spacing sample-status-warning">
                    Samples that are not currently in storage are not editable here.
                </div>
            );
        } else {
            return (
                <div className="top-spacing sample-status-warning">
                    Aliquot data inherited from the original sample cannot be updated here.
                </div>
            );
        }
    };

    onConfirmConsumedSamplesDialog = (shouldDiscard: boolean, comment: string): any => {
        const { pendingUpdateDataRows } = this.state;
        this.setState(
            {
                discardConsumed: shouldDiscard,
                discardSamplesComment: comment,
                showDiscardDialog: false,
            },
            () => {
                return this.updateAllTabRows(pendingUpdateDataRows, true);
            }
        );
    };

    onDismissConsumedSamplesDialog = (): any => {
        this.setState({
            showDiscardDialog: false,
        });
    };

    render() {
        const { selectionData, onGridEditCancel, determineSampleData, determineStorage, determineLineage } = this.props;
        const { discardSamplesCount, totalEditCount, showDiscardDialog } = this.state;

        const models = [];
        if (determineSampleData) {
            const samplesGrid = this.getSamplesEditorQueryGridModel();
            if (!samplesGrid || !samplesGrid.isLoaded) return <LoadingSpinner />;
            models.push(samplesGrid);
        }

        if (determineStorage) {
            const storageGrid = this.getStorageEditorQueryGridModel();
            if (!storageGrid || !storageGrid.isLoaded) return <LoadingSpinner />;
            models.push(storageGrid);
        }

        if (determineLineage) {
            const lineageGrid = this.getLineageEditorQueryGridModel();
            if (!lineageGrid || !lineageGrid.isLoaded) return <LoadingSpinner />;
            models.push(lineageGrid);
        }

        return (
            <>
                {showDiscardDialog && (
                    <DiscardConsumedSamplesModal
                        consumedSampleCount={discardSamplesCount}
                        totalSampleCount={totalEditCount}
                        onConfirm={this.onConfirmConsumedSamplesDialog}
                        onCancel={this.onDismissConsumedSamplesDialog}
                    />
                )}
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
            </>
        );
    }
}

export const SamplesEditableGrid = SamplesSelectionProvider<SamplesEditableGridProps & SamplesSelectionProviderProps>(
    SamplesEditableGridBase
);

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
                sampleParent.type.entityDataType.uniqueFieldKey, displayQueryModel.schemaName
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
