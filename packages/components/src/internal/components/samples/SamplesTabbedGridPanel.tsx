import React, { ComponentType, FC, memo, useCallback, useMemo, useState } from 'react';
import { Set, List, Map, OrderedMap } from 'immutable';
import { AuditBehaviorTypes, Filter, Query } from '@labkey/api';

import {TabbedGridPanel, TabbedGridPanelProps} from '../../../public/QueryModel/TabbedGridPanel';

import { userCanEditStorageData } from '../../app/utils';

import { SamplesEditableGrid, SamplesEditableGridProps } from './SamplesEditableGrid';
import { SamplesBulkUpdateForm } from './SamplesBulkUpdateForm';
import { ALIQUOT_FILTER_MODE } from './SampleAliquotViewSelector';
import { SampleGridButtonProps } from './models';
import {EXPORT_TYPES, MAX_EDITABLE_GRID_ROWS, NO_UPDATES_MESSAGE} from "../../constants";
import {InjectedQueryModels, RequiresModelAndActions} from "../../../public/QueryModel/withQueryModels";
import {User} from "../base/models/User";
import {useNotificationsContext} from "../notifications/NotificationsContext";
import {IS_ALIQUOT_COL} from "./constants";
import {SchemaQuery} from "../../../public/SchemaQuery";
import {updateRows} from "../../query/api";
import {invalidateLineageResults} from "../lineage/actions";
import {SampleTypeDataType} from "../entities/constants";
import {resolveErrorMessage} from "../../util/messaging";
import {GridAliquotViewSelector} from "../gridbar/GridAliquotViewSelector";

const EXPORT_TYPES_WITH_LABEL = Set.of(EXPORT_TYPES.CSV, EXPORT_TYPES.EXCEL, EXPORT_TYPES.TSV, EXPORT_TYPES.LABEL);

interface Props extends InjectedQueryModels {
    afterSampleActionComplete?: (hasDelete?: boolean) => void;
    asPanel?: boolean;
    canPrintLabels?: boolean;
    containerFilter?: Query.ContainerFilter;
    createBtnParentKey?: string;
    createBtnParentType?: string;
    getIsDirty?: () => boolean;
    getSampleAuditBehaviorType: () => AuditBehaviorTypes;
    gridButtonProps?: any;
    gridButtons?: ComponentType<SampleGridButtonProps & RequiresModelAndActions>;
    // use if you have multiple tabs but want to start on something other than the first one
    initialTabId?: string;
    // if a usage wants to just show a single GridPanel, they should provide a modelId prop
    modelId?: string;
    onPrintLabel?: (modelId?: string) => void;
    onSampleTabSelect?: (modelId: string) => void;
    sampleAliquotType?: ALIQUOT_FILTER_MODE;
    // the init sampleAliquotType, requires all query models to have completed loading queryInfo prior to rendering of the component
    samplesEditableGridProps: Partial<SamplesEditableGridProps>;
    setIsDirty?: (isDirty: boolean) => void;
    tabbedGridPanelProps?: Partial<TabbedGridPanelProps>;
    user: User;
    withTitle?: boolean;
}

export const SamplesTabbedGridPanel: FC<Props> = memo(props => {
    const {
        actions,
        containerFilter,
        queryModels,
        modelId,
        user,
        asPanel,
        canPrintLabels,
        onPrintLabel,
        afterSampleActionComplete,
        initialTabId,
        createBtnParentType,
        createBtnParentKey,
        sampleAliquotType,
        samplesEditableGridProps,
        gridButtons,
        gridButtonProps,
        getSampleAuditBehaviorType,
        getIsDirty,
        onSampleTabSelect,
        setIsDirty,
        tabbedGridPanelProps,
        withTitle,
    } = props;
    const { dismissNotifications, createNotification } = useNotificationsContext();
    const onLabelExport = { [EXPORT_TYPES.LABEL]: onPrintLabel };

    const tabs = useMemo(() => {
        return modelId ? [modelId] : Object.keys(queryModels);
    }, [modelId, queryModels]);
    const [activeTabId, setActiveTabId] = useState<string>(initialTabId ?? tabs[0]);
    const onTabSelect = useCallback((tab: string) => {
        setActiveTabId(tab);
        onSampleTabSelect?.(tab);
    }, []);
    const activeModel = useMemo(() => queryModels[activeTabId], [activeTabId, queryModels]);
    const hasSelections = activeModel?.hasSelections;
    const selections = activeModel?.selections;
    const activeModelId = useMemo(() => activeModel?.id, [activeModel]);
    const selection = useMemo(() => List(Array.from(selections ?? [])), [selections]);
    const hasValidMaxSelection = useMemo(() => {
        const selSize = selections?.size ?? 0;
        return selSize > 0 && selSize <= MAX_EDITABLE_GRID_ROWS;
    }, [selections]);

    const [isEditing, setIsEditing] = useState<boolean>();
    const [showBulkUpdate, setShowBulkUpdate] = useState<boolean>();
    const [selectionData, setSelectionData] = useState<Map<string, any>>();
    const [editableGridUpdateData, setEditableGridUpdateData] = useState<OrderedMap<string, any>>();

    const onEditSelectionInGrid = useCallback(
        (
            editableGridUpdateData_: OrderedMap<string, any>,
            editableGridDataForSelection: Map<string, any>
        ): Promise<Map<string, any>> => {
            setEditableGridUpdateData(editableGridUpdateData_);
            setIsDirty?.(true);
            return Promise.resolve(editableGridDataForSelection);
        },
        []
    );

    const [activeActiveAliquotMode, setActiveAliquotMode] = useState<string>(
        sampleAliquotType ?? ALIQUOT_FILTER_MODE.all
    );

    const onAliquotViewUpdate = useCallback(
        (aliquotFilter: Filter.IFilter, filterAliquotColName: string, newAliquotMode: ALIQUOT_FILTER_MODE) => {
            setActiveAliquotMode(newAliquotMode);
            Object.values(queryModels).forEach(model => {
                // account for the case where the aliquot column is in the queryModel via a lookup from the sample ID
                let aliquotColName = IS_ALIQUOT_COL;
                if (!model.getColumnByFieldKey(IS_ALIQUOT_COL)) {
                    aliquotColName = model.allColumns?.find(
                        c => c.fieldKey?.toLowerCase().indexOf('/' + IS_ALIQUOT_COL.toLowerCase()) > -1
                    )?.fieldKey;
                }

                const newFilters = model.filterArray.filter(filter => {
                    return aliquotColName?.toLowerCase() !== filter.getColumnName().toLowerCase();
                });

                if (aliquotFilter && aliquotColName) {
                    newFilters.push(Filter.create(aliquotColName, newAliquotMode === ALIQUOT_FILTER_MODE.aliquots));
                }

                if (model.queryInfo) {
                    actions.setFilters(model.id, newFilters, true);
                }
            });
        },
        [queryModels, actions]
    );

    const onShowBulkUpdate = useCallback(() => {
        if (hasSelections) {
            dismissNotifications();
            setShowBulkUpdate(true);
        }
    }, [hasSelections]);

    const onBulkUpdateError = useCallback(
        (message: string) => {
            createNotification(message, true);
        },
        [createNotification]
    );

    const onBulkUpdateComplete = useCallback(
        (data: Map<string, any>, submitForEdit = false) => {
            setShowBulkUpdate(false);
            setSelectionData(submitForEdit ? data : undefined);
            if (!submitForEdit) {
                actions.loadModel(activeModelId, true);
                afterSampleActionComplete?.();
            }
        },
        [actions, activeModelId, afterSampleActionComplete]
    );

    const resetState = useCallback(() => {
        setEditableGridUpdateData(undefined);
        setSelectionData(undefined);
        setIsEditing(false);
        setShowBulkUpdate(false);
        setIsDirty?.(false);
    }, []);

    const toggleEditWithGridUpdate = useCallback(() => {
        if (isEditing) {
            resetState();
        } else if (hasValidMaxSelection) {
            dismissNotifications();
            setIsEditing(true);
        }
    }, [isEditing, hasValidMaxSelection, resetState]);

    const onGridEditComplete = useCallback(() => {
        afterSampleActionComplete?.();
        resetState();
    }, [afterSampleActionComplete, resetState]);

    const _afterSampleActionComplete = useCallback(
        (hasDelete?: boolean) => {
            dismissNotifications();
            actions.loadModel(activeModelId, true);
            afterSampleActionComplete?.(hasDelete);
            resetState();
        },
        [actions, activeModelId, afterSampleActionComplete, resetState]
    );

    const afterSampleDelete = useCallback(
        (rowsToKeep: any[]) => {
            const ids = [];
            if (rowsToKeep.length > 0) {
                rowsToKeep.forEach(row => {
                    ids.push(row['RowId']);
                });
            }
            actions.replaceSelections(activeModelId, ids);

            _afterSampleActionComplete(true);
        },
        [actions, activeModelId, _afterSampleActionComplete]
    );

    const onUpdateRows = useCallback(
        async (schemaQuery: SchemaQuery, rows: any[]): Promise<void> => {
            if (rows.length === 0) {
                dismissNotifications();
                createNotification(NO_UPDATES_MESSAGE, true);
                return;
            }

            return updateRows({
                schemaQuery,
                rows,
                auditBehavior: getSampleAuditBehaviorType(),
            })
                .then(result => {
                    invalidateLineageResults();
                    dismissNotifications(); // get rid of any error notifications that have already been created

                    const noun = rows.length === 1 ? SampleTypeDataType.nounSingular : SampleTypeDataType.nounPlural;
                    createNotification('Successfully updated ' + result.rows.length + ' ' + noun + '.', true);
                })
                .catch(reason => {
                    dismissNotifications(); // get rid of any error notifications that have already been created
                    createNotification({
                        alertClass: 'danger',
                        message: resolveErrorMessage(
                            reason,
                            SampleTypeDataType.nounSingular,
                            SampleTypeDataType.nounPlural,
                            'update'
                        ),
                    });
                });
        },
        [createNotification, dismissNotifications, getSampleAuditBehaviorType]
    );

    const _gridButtonProps = {
        ...gridButtonProps,
        afterSampleDelete,
        afterSampleActionComplete: _afterSampleActionComplete,
        createBtnParentType,
        createBtnParentKey,
        model: activeModel,
        showBulkUpdate: onShowBulkUpdate,
        toggleEditWithGridUpdate,
        onTabbedViewAliquotSelectorUpdate: onAliquotViewUpdate,
        initAliquotMode: activeActiveAliquotMode,
    };

    const isMedia = activeModel.queryInfo?.isMedia;

    return (
        <>
            {isEditing || selectionData ? (
                <SamplesEditableGrid
                    {...(samplesEditableGridProps as SamplesEditableGridProps)}
                    determineSampleData={user.canUpdate}
                    determineLineage={user.canUpdate && !isMedia}
                    determineStorage={userCanEditStorageData(user) && !isMedia}
                    displayQueryModel={activeModel}
                    editableGridUpdateData={editableGridUpdateData}
                    onGridEditCancel={resetState}
                    onGridEditComplete={onGridEditComplete}
                    getIsDirty={getIsDirty}
                    setIsDirty={setIsDirty}
                    sampleSet={activeModel.schemaQuery.queryName}
                    selection={selection}
                    selectionData={selectionData}
                    user={user}
                />
            ) : (
                <TabbedGridPanel
                    {...tabbedGridPanelProps}
                    title={withTitle ? 'Samples' : undefined}
                    asPanel={asPanel}
                    actions={actions}
                    queryModels={queryModels}
                    activeModelId={activeTabId}
                    tabOrder={tabs}
                    onTabSelect={onTabSelect}
                    ButtonsComponent={gridButtons}
                    buttonsComponentProps={_gridButtonProps}
                    ButtonsComponentRight={SampleTabbedGridButtonsRight}
                    supportedExportTypes={canPrintLabels ? EXPORT_TYPES_WITH_LABEL : undefined}
                    onExport={canPrintLabels ? onLabelExport : undefined}
                    showRowCountOnTabs
                />
            )}
            {showBulkUpdate && (
                <SamplesBulkUpdateForm
                    containerFilter={containerFilter}
                    determineSampleData
                    selection={selection}
                    sampleSet={activeModel.schemaQuery.queryName}
                    sampleSetLabel={activeModel.queryInfo.title}
                    queryModel={activeModel}
                    hasValidMaxSelection={hasValidMaxSelection}
                    onCancel={resetState}
                    onBulkUpdateError={onBulkUpdateError}
                    onBulkUpdateComplete={onBulkUpdateComplete}
                    editSelectionInGrid={onEditSelectionInGrid}
                    updateRows={onUpdateRows}
                    determineStorage={userCanEditStorageData(user)} // determine storage for discard consumed samples
                    user={user}
                />
            )}
        </>
    );
});

SamplesTabbedGridPanel.defaultProps = {
    asPanel: true,
    withTitle: true,
    canPrintLabels: false,
};

SamplesTabbedGridPanel.displayName = 'SamplesTabbedGridPanel';

// NOTE: if this is removed, we will need to port the syncInitMode behavior from GridAliquotViewSelector so that we
// can apply the initial sampleAliquotType URL param filter to the grid on page load
const SampleTabbedGridButtonsRight: FC<SampleGridButtonProps & RequiresModelAndActions> = props => {
    const { model, onTabbedViewAliquotSelectorUpdate, initAliquotMode } = props;

    return (
        <GridAliquotViewSelector
            queryModel={model}
            updateFilter={onTabbedViewAliquotSelectorUpdate}
            initAliquotMode={initAliquotMode}
        />
    );
};
