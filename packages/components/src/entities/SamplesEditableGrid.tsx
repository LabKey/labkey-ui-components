import React from 'react';
import { List, Map, OrderedMap } from 'immutable';

import { AuditBehaviorTypes, Query } from '@labkey/api';

import { EntityChoice, IEntityTypeOption } from '../internal/components/entities/models';

import { getDefaultAPIWrapper } from '../internal/APIWrapper';

import { UpdateGridTab } from '../internal/components/editable/EditableGridPanelForUpdateWithLineage';

import { EditorMode, EditorModel, IEditableGridLoader, IGridResponse } from '../internal/components/editable/models';

import { isFreezerManagementEnabled } from '../internal/app/utils';
import { SamplesEditableGridProps } from '../internal/sampleModels';

import { QueryModel } from '../public/QueryModel/QueryModel';
import { SchemaQuery } from '../public/SchemaQuery';
import {
    NotificationsContextProps,
    withNotificationsContext,
} from '../internal/components/notifications/NotificationsContext';

import { caseInsensitive } from '../internal/util/utils';
import { NO_UPDATES_MESSAGE } from '../internal/constants';
import { deleteRows } from '../internal/query/api';
import { SCHEMAS } from '../internal/schemas';
import { resolveErrorMessage } from '../internal/util/messaging';
import { invalidateLineageResults } from '../internal/components/lineage/actions';
import { QueryColumn } from '../public/QueryColumn';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';
import { EditableGridLoaderFromSelection } from '../internal/components/editable/EditableGridLoaderFromSelection';
import { QueryInfo } from '../public/QueryInfo';
import { LineageEditableGridLoaderFromSelection } from '../internal/components/editable/LineageEditableGridLoaderFromSelection';
import { getSelectedData } from '../internal/actions';

import { SampleStateType } from '../internal/components/samples/constants';

import { getUpdatedLineageRows } from '../internal/components/samples/actions';

import { SamplesSelectionProviderProps, SamplesSelectionResultProps } from '../internal/components/samples/models';

import { SamplesEditableGridPanelForUpdate } from './SamplesEditableGridPanelForUpdate';
import { DiscardConsumedSamplesModal } from './DiscardConsumedSamplesModal';
import { SamplesSelectionProvider } from './SamplesSelectionContextProvider';

import { getOriginalParentsFromLineage } from './actions';

type Props = SamplesEditableGridProps &
    SamplesSelectionProviderProps &
    SamplesSelectionResultProps &
    NotificationsContextProps;

const STORAGE_UPDATE_FIELDS = ['StoredAmount', 'Units', 'FreezeThawCount'];
const SAMPLES_EDIT_GRID_ID = 'update-samples-grid';
const SAMPLES_STORAGE_EDIT_GRID_ID = 'update-samples-storage-grid';
const SAMPLES_LINEAGE_EDIT_GRID_ID = 'update-samples-lineage-grid';

const INVENTORY_ITEM_QS = new SchemaQuery('inventory', 'item');

interface State {
    consumedStatusIds: number[];
    discardConsumed: boolean;
    discardSamplesComment: string;
    discardSamplesCount: number;
    includedTabs: UpdateGridTab[];
    originalParents: Record<string, List<EntityChoice>>;
    parentTypeOptions: Map<string, List<IEntityTypeOption>>;
    pendingUpdateDataRows: any[];
    showDiscardDialog: boolean;
    totalEditCount: number;
}

class SamplesEditableGridBase extends React.Component<Props, State> {
    private readOnlyColumns: List<string> = undefined;

    private _hasError: boolean;

    static defaultProps = {
        samplesGridRequiredColumns: ['description', 'AliquotedFromLSID', 'lsid'],
        api: getDefaultAPIWrapper(),
    };

    constructor(props: Props) {
        super(props);
        this._hasError = false;

        const includedTabs = [];
        if (props.determineSampleData) includedTabs.push(UpdateGridTab.Samples);
        if (props.determineStorage) includedTabs.push(UpdateGridTab.Storage);
        if (props.determineLineage) includedTabs.push(UpdateGridTab.Lineage);
        this.state = {
            originalParents: undefined,
            parentTypeOptions: undefined,
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
        this.props.dismissNotifications();
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
                this.props.createNotification({
                    alertClass: 'danger',
                    message:
                        'Error loading sample statuses. If you want to discard any samples being updated to a Consumed status, you will have to do that separately.',
                });
            });
    }

    componentWillUnmount(): void {
        // dismiss grid error msg, retain success msg
        if (this._hasError) this.props.dismissNotifications();
    }

    get allAliquots(): boolean {
        const { aliquots, displayQueryModel } = this.props;
        return this.hasAliquots() && aliquots.length === displayQueryModel.selections.size;
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

    getSamplesGridRequiredColumns(): string[] {
        const { displayQueryModel, samplesGridRequiredColumns } = this.props;
        return [
            ...samplesGridRequiredColumns,
            ...displayQueryModel.queryInfo
                .getUniqueIdColumns()
                .map(column => column.fieldKey)
                .toArray(),
        ];
    }

    getSchemaQuery = (): SchemaQuery => {
        return this.props.displayQueryModel?.queryInfo?.schemaQuery;
    };

    initLineageEditableGrid = async (): Promise<void> => {
        const { determineLineage, parentDataTypes } = this.props;
        if (determineLineage && this.hasParentDataTypes()) {
            const { originalParents, parentTypeOptions } = await getOriginalParentsFromLineage(
                this.props.sampleLineage,
                parentDataTypes.toArray()
            );
            this.setState(() => ({ originalParents, parentTypeOptions }));
        }
    };

    hasParentDataTypes = (): boolean => {
        return this.props.parentDataTypes?.size > 0;
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
            if (includedTabs[tabIndex] === UpdateGridTab.Storage) {
                storageRows = data.updatedRows;
                sampleSchemaQuery = data.schemaQuery;
            } else if (includedTabs[tabIndex] === UpdateGridTab.Lineage) {
                lineageRows = getUpdatedLineageRows(data.updatedRows, data.originalRows, aliquots);
                sampleSchemaQuery = data.schemaQuery;
            } else {
                sampleRows = data.updatedRows;
                sampleSchemaQuery = data.schemaQuery;
                if (sampleItems) {
                    sampleRows.forEach(row => {
                        if (consumedStatusIds?.indexOf(caseInsensitive(row, 'sampleState')) > -1) {
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

        if (!skipConfirmDiscard && isFreezerManagementEnabled() && discardStorageRows.length > 0) {
            return new Promise(resolve => {
                this.setState({
                    pendingUpdateDataRows: updateDataRows,
                    showDiscardDialog: isFreezerManagementEnabled(),
                    discardSamplesCount: discardStorageRows.length,
                    totalEditCount: totalSamplesToUpdate,
                });
                resolve(false);
            });
        }

        if (storageRows.length === 0 && sampleRows.length === 0) {
            return new Promise(resolve => {
                this._hasError = false;
                this.props.dismissNotifications();
                this.props.createNotification(NO_UPDATES_MESSAGE);
                resolve('No changes to be saved.');
            });
        }

        const convertedStorageData = this.getStorageUpdateData(storageRows);
        if (convertedStorageData?.errors) {
            return new Promise((resolve, reject) => {
                this._hasError = true;
                reject(convertedStorageData?.errors.join('\n'));
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
                            this.props.dismissNotifications();
                            this.props.createNotification({
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
                            invalidateLineageResults();
                        }
                    }

                    this.props.dismissNotifications(); // get rid of any error notifications that have already been created
                    this.props.createNotification(
                        'Successfully updated ' + totalSamplesToUpdate + ' ' + noun + discardSuccessMsg + '.'
                    );

                    this.onGridEditComplete();

                    resolve(result);
                },
                failure: reason => {
                    this._hasError = true;
                    reject(resolveErrorMessage(reason, 'sample', 'samples', 'update'));
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
        return this.props.aliquots?.length > 0;
    };

    getSamplesUpdateColumns = (tabInd: number): List<QueryColumn> => {
        if (this.getCurrentTab(tabInd) !== UpdateGridTab.Samples) return undefined;

        const { displayQueryModel, sampleTypeDomainFields } = this.props;
        const allColumns = displayQueryModel.queryInfo.getUpdateColumns(this.getReadOnlyColumns());

        // remove aliquot specific fields if all selected are samples
        const keepAliquotFields = this.hasAliquots();
        if (keepAliquotFields) return allColumns;

        let updatedColumns = List<QueryColumn>();
        allColumns.forEach(col => {
            if (sampleTypeDomainFields.aliquotFields.indexOf(col.fieldKey.toLowerCase()) === -1)
                updatedColumns = updatedColumns.push(col);
        });

        return updatedColumns;
    };

    getExportColumnFilter = (col: QueryColumn): boolean => {
        return this.props.sampleTypeDomainFields.aliquotFields.indexOf(col.fieldKey.toLowerCase()) === -1;
    };

    getSelectedSamplesNoun = (): string => {
        return this.allAliquots ? 'aliquot' : 'sample';
    };

    getCurrentTab = (tabInd: number): number => {
        const { includedTabs } = this.state;
        return tabInd === undefined ? includedTabs[0] : includedTabs[tabInd];
    };

    onConfirmConsumedSamplesDialog = (shouldDiscard: boolean, comment: string): void => {
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

    onDismissConsumedSamplesDialog = (): void => {
        this.setState({ showDiscardDialog: false });
    };

    render() {
        const {
            onGridEditCancel,
            determineSampleData,
            determineStorage,
            determineLineage,
            displayQueryModel,
            editableGridUpdateData,
            selectionData,
            aliquots,
            sampleTypeDomainFields,
            samplesGridOmittedColumns,
            sampleLineageKeys,
            sampleLineage,
            getIsDirty,
            setIsDirty,
            parentDataTypes,
            combineParentTypes,
            noStorageSamples,
        } = this.props;
        const {
            discardSamplesCount,
            totalEditCount,
            showDiscardDialog,
            originalParents,
            includedTabs,
            parentTypeOptions,
            consumedStatusIds,
        } = this.state;

        if ((determineLineage && this.hasParentDataTypes() && !originalParents) || !consumedStatusIds) {
            return <LoadingSpinner />;
        }

        const loaders: IEditableGridLoader[] = [];
        if (determineSampleData) {
            const allAliquots = this.allAliquots;
            loaders.push(
                new EditableGridLoaderFromSelection(
                    SAMPLES_EDIT_GRID_ID,
                    displayQueryModel.queryInfo,
                    editableGridUpdateData,
                    this.getSamplesGridRequiredColumns(),
                    samplesGridOmittedColumns ? samplesGridOmittedColumns.toArray() : [],
                    this.getSamplesUpdateColumns(0),
                    allAliquots ? [] : aliquots,
                    allAliquots ? undefined : sampleTypeDomainFields.metaFields
                )
            );
        }

        if (determineStorage) {
            let updateColumns = List<QueryColumn>();
            let queryInfoCols = OrderedMap<string, QueryColumn>();
            displayQueryModel.queryInfo.columns.forEach((column, key) => {
                if (key?.toLowerCase() === 'rowid') {
                    queryInfoCols = queryInfoCols.set(key, column);
                } else if (key?.toLowerCase() === 'name') {
                    queryInfoCols = queryInfoCols.set(key, column);
                    updateColumns = updateColumns.push(column);
                } else if (STORAGE_UPDATE_FIELDS.indexOf(column.fieldKey) > -1) {
                    const updatedCol = column.mutate({
                        shownInUpdateView: true,
                        userEditable: true,
                    });
                    queryInfoCols = queryInfoCols.set(key, updatedCol);
                    updateColumns = updateColumns.push(updatedCol);
                }
            });
            const storageQueryInfo = displayQueryModel.queryInfo
                .merge({ columns: queryInfoCols })
                .asImmutable() as QueryInfo;

            loaders.push(
                new StorageEditableGridLoaderFromSelection(
                    SAMPLES_STORAGE_EDIT_GRID_ID,
                    storageQueryInfo,
                    STORAGE_UPDATE_FIELDS,
                    [],
                    updateColumns
                )
            );
        }

        if (determineLineage && this.hasParentDataTypes()) {
            loaders.push(
                new LineageEditableGridLoaderFromSelection(
                    SAMPLES_LINEAGE_EDIT_GRID_ID,
                    displayQueryModel,
                    originalParents,
                    sampleLineageKeys,
                    sampleLineage,
                    aliquots
                )
            );
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
                <SamplesEditableGridPanelForUpdate
                    queryModel={displayQueryModel}
                    loaders={loaders}
                    selectionData={selectionData}
                    updateAllTabRows={this.updateAllTabRows}
                    onCancel={onGridEditCancel}
                    onComplete={this.onGridEditComplete}
                    singularNoun={this.getSelectedSamplesNoun()}
                    pluralNoun={this.getSelectedSamplesNoun() + 's'}
                    readOnlyColumns={this.getReadOnlyColumns()}
                    getIsDirty={getIsDirty}
                    setIsDirty={setIsDirty}
                    includedTabs={includedTabs}
                    parentDataTypes={parentDataTypes}
                    combineParentTypes={combineParentTypes}
                    aliquots={aliquots}
                    noStorageSamples={noStorageSamples}
                    sampleTypeDomainFields={sampleTypeDomainFields}
                    parentTypeOptions={parentTypeOptions}
                    getUpdateColumns={this.getSamplesUpdateColumns}
                    exportColFilter={this.hasAliquots() ? null : this.getExportColumnFilter}
                />
            </>
        );
    }
}

export const SamplesEditableGrid = SamplesSelectionProvider<SamplesEditableGridProps & SamplesSelectionProviderProps>(
    withNotificationsContext(SamplesEditableGridBase)
);

class StorageEditableGridLoaderFromSelection implements IEditableGridLoader {
    columns: List<QueryColumn>;
    id: string;
    mode: EditorMode;
    queryInfo: QueryInfo;
    requiredColumns: string[];
    omittedColumns: string[];

    constructor(
        id: string,
        queryInfo: QueryInfo,
        requiredColumns: string[],
        omittedColumns: string[],
        columns: List<QueryColumn>
    ) {
        this.columns = columns;
        this.id = id;
        this.mode = EditorMode.Update;
        this.queryInfo = queryInfo;
        this.requiredColumns = requiredColumns;
        this.omittedColumns = omittedColumns;
    }

    fetch(queryModel: QueryModel): Promise<IGridResponse> {
        return new Promise((resolve, reject) => {
            const { schemaName, queryName, queryParameters, viewName } = queryModel;
            const columnString = queryModel.getRequestColumnsString(this.requiredColumns, this.omittedColumns, true);
            const sorts = queryModel.sorts.join(',');
            const selectedIds = [...queryModel.selections];
            return getSelectedData(schemaName, queryName, selectedIds, columnString, sorts, queryParameters, viewName)
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
    }
}
