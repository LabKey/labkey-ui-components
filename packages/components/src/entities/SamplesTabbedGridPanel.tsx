import React, { ComponentType, FC, memo, useCallback, useMemo, useState } from 'react';
import { List, Map, OrderedMap } from 'immutable';
import { AuditBehaviorTypes, Filter, Query } from '@labkey/api';

import { TabbedGridPanel, TabbedGridPanelProps } from '../public/QueryModel/TabbedGridPanel';
import { SamplesEditableGridProps } from '../internal/sampleModels';
import { userCanEditStorageData } from '../internal/app/utils';

import {
    EXPORT_TYPES,
    EXPORT_TYPES_WITH_LABEL,
    MAX_EDITABLE_GRID_ROWS,
    NO_UPDATES_MESSAGE,
} from '../internal/constants';
import { InjectedQueryModels, RequiresModelAndActions } from '../public/QueryModel/withQueryModels';
import { User } from '../internal/components/base/models/User';
import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';

import { SchemaQuery } from '../public/SchemaQuery';
import { updateRows } from '../internal/query/api';
import { invalidateLineageResults } from '../internal/components/lineage/actions';
import { SampleTypeDataType } from '../internal/components/entities/constants';

import { ALIQUOT_FILTER_MODE, IS_ALIQUOT_COL } from '../internal/components/samples/constants';
import { SampleGridButtonProps } from '../internal/components/samples/models';

import { PrintLabelsModal } from '../internal/components/labels/PrintLabelsModal';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { useLabelPrintingContext } from '../internal/components/labels/LabelPrintingContextProvider';

import { isAllSamplesSchema } from '../internal/components/samples/utils';

import { SamplesEditableGrid } from './SamplesEditableGrid';
import { SamplesBulkUpdateForm } from './SamplesBulkUpdateForm';
import { GridAliquotViewSelector } from './GridAliquotViewSelector';

interface Props extends InjectedQueryModels {
    afterSampleActionComplete?: (requiresModelReload?: boolean) => void;
    asPanel?: boolean;
    containerFilter?: Query.ContainerFilter;
    createBtnParentKey?: string;
    createBtnParentType?: string;
    getIsDirty?: () => boolean;
    getSampleAuditBehaviorType: () => AuditBehaviorTypes;
    gridButtonProps?: any;
    gridButtons?: ComponentType<SampleGridButtonProps & RequiresModelAndActions>;
    // use if you have multiple tabs but want to start on something other than the first one
    initialTabId?: string;
    isAllSamplesTab?: (QuerySchema) => boolean;
    // if a usage wants to just show a single GridPanel, they should provide a modelId prop
    modelId?: string;
    onSampleTabSelect?: (modelId: string) => void;
    // the init sampleAliquotType, requires all query models to have completed loading queryInfo prior to rendering of the component
    sampleAliquotType?: ALIQUOT_FILTER_MODE;
    samplesEditableGridProps?: Partial<SamplesEditableGridProps>;
    setIsDirty?: (isDirty: boolean) => void;
    showLabelOption?: boolean;
    tabRowCounts?: { [key: string]: number };
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
        afterSampleActionComplete,
        initialTabId,
        createBtnParentType,
        createBtnParentKey,
        sampleAliquotType,
        samplesEditableGridProps = {},
        gridButtons,
        gridButtonProps,
        getSampleAuditBehaviorType,
        getIsDirty,
        onSampleTabSelect,
        setIsDirty,
        tabbedGridPanelProps,
        withTitle,
        showLabelOption,
        tabRowCounts,
        isAllSamplesTab = isAllSamplesSchema,
    } = props;
    const { dismissNotifications, createNotification } = useNotificationsContext();

    const tabs = useMemo(() => {
        return modelId ? [modelId] : Object.keys(queryModels);
    }, [modelId, queryModels]);
    const [activeTabId, setActiveTabId] = useState<string>(initialTabId ?? tabs[0]);
    const onTabSelect = useCallback(
        (tab: string) => {
            setActiveTabId(tab);
            onSampleTabSelect?.(tab);
        },
        [onSampleTabSelect]
    );
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
    // This prevents type error requiring otherwise unused properties
    const editableGridProps = useMemo(
        () => samplesEditableGridProps as SamplesEditableGridProps,
        [samplesEditableGridProps]
    );

    const [printDialogModel, setPrintDialogModel] = useState<QueryModel>();
    const { canPrintLabels, printServiceUrl, defaultLabel } = useLabelPrintingContext();

    const onEditSelectionInGrid = useCallback(
        (
            editableGridUpdateData_: OrderedMap<string, any>,
            editableGridDataForSelection: Map<string, any>
        ): Promise<Map<string, any>> => {
            setEditableGridUpdateData(editableGridUpdateData_);
            setIsDirty?.(true);
            return Promise.resolve(editableGridDataForSelection);
        },
        [setIsDirty]
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
    }, [dismissNotifications, hasSelections]);

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
    }, [setIsDirty]);

    const toggleEditWithGridUpdate = useCallback(() => {
        if (isEditing) {
            resetState();
        } else if (hasValidMaxSelection) {
            dismissNotifications();
            setIsEditing(true);
        }
    }, [isEditing, hasValidMaxSelection, resetState, dismissNotifications]);

    const onGridEditComplete = useCallback(() => {
        afterSampleActionComplete?.();
        resetState();
    }, [afterSampleActionComplete, resetState]);

    const _afterSampleActionComplete = useCallback(
        (requiresModelReload?: boolean) => {
            dismissNotifications();
            actions.loadModel(activeModelId, true, requiresModelReload);
            afterSampleActionComplete?.(requiresModelReload);
            resetState();
        },
        [actions, activeModelId, afterSampleActionComplete, dismissNotifications, resetState]
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
            }).then(result => {
                invalidateLineageResults();
                dismissNotifications(); // get rid of any error notifications that have already been created

                const noun = rows.length === 1 ? SampleTypeDataType.nounSingular : SampleTypeDataType.nounPlural;
                createNotification('Successfully updated ' + result.rows.length + ' ' + noun + '.', true);
            });
            // catch block intentionally absent so callers can handle the errors appropriately
        },
        [createNotification, dismissNotifications, getSampleAuditBehaviorType]
    );

    const onPrintLabel = useCallback(
        (modelId: string): void => {
            const _model = queryModels[modelId] ?? activeModel;
            setPrintDialogModel(_model);
        },
        [queryModels, activeModel]
    );

    const onLabelExport = { [EXPORT_TYPES.LABEL]: onPrintLabel };

    const onCancelPrint = useCallback((): void => {
        setPrintDialogModel(undefined);
    }, []);

    const afterPrint = useCallback(
        (numSamples: number, numLabels: number): void => {
            setPrintDialogModel(undefined);
            createNotification(
                'Successfully printed ' +
                    numLabels +
                    (numSamples === 0 ? ' blank ' : '') +
                    (numLabels > 1 ? ' labels.' : ' label.')
            );
        },
        [createNotification]
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

    const isMedia = activeModel?.queryInfo?.isMedia;
    const showPrintOption = !isAllSamplesTab(activeModel?.schemaQuery) && showLabelOption && canPrintLabels;

    return (
        <>
            {isEditing || selectionData ? (
                <SamplesEditableGrid
                    {...editableGridProps}
                    determineSampleData={user.canUpdate || userCanEditStorageData(user)}
                    determineLineage={user.canUpdate && !isMedia}
                    determineStorage={userCanEditStorageData(user) && !isMedia}
                    displayQueryModel={activeModel}
                    viewName={activeModel.viewName}
                    editableGridUpdateData={editableGridUpdateData}
                    onGridEditCancel={resetState}
                    onGridEditComplete={onGridEditComplete}
                    getIsDirty={getIsDirty}
                    setIsDirty={setIsDirty}
                    sampleSet={activeModel?.schemaQuery.queryName}
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
                    supportedExportTypes={showPrintOption ? EXPORT_TYPES_WITH_LABEL : undefined}
                    onExport={showPrintOption ? onLabelExport : undefined}
                    showRowCountOnTabs
                    tabRowCounts={tabRowCounts}
                />
            )}
            {showBulkUpdate && (
                <SamplesBulkUpdateForm
                    containerFilter={containerFilter}
                    determineSampleData
                    selection={selection}
                    sampleSet={activeModel?.schemaQuery.queryName}
                    sampleSetLabel={activeModel?.queryInfo.title}
                    queryModel={activeModel}
                    viewName={activeModel?.viewName}
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
            {printDialogModel && (
                <PrintLabelsModal
                    afterPrint={afterPrint}
                    printServiceUrl={printServiceUrl}
                    defaultLabel={defaultLabel}
                    onCancel={onCancelPrint}
                    model={printDialogModel}
                    sampleIds={[...printDialogModel.selections]}
                    show={true}
                    showSelection={true}
                />
            )}
        </>
    );
});

SamplesTabbedGridPanel.defaultProps = {
    asPanel: true,
    withTitle: true,
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
