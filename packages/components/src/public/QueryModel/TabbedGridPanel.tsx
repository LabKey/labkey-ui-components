/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';

import { ExportModal } from '../../internal/components/gridbar/ExportModal';
import { EXPORT_TYPES } from '../../internal/constants';
import { exportTabsXlsx } from '../../internal/actions';

import { useNotificationsContext } from '../../internal/components/notifications/NotificationsContext';

import { GridPanel, GridPanelProps } from './GridPanel';
import { InjectedQueryModels } from './withQueryModels';
import { QueryModel } from './QueryModel';
import { getQueryModelExportParams } from './utils';

interface GridTabProps {
    isActive: boolean;
    model: QueryModel;
    onSelect: (id: string) => void;
    pullRight: boolean;
    showRowCount: boolean;
    tabRowCount?: number;
}

const GridTab: FC<GridTabProps> = memo(({ isActive, model, onSelect, pullRight, showRowCount, tabRowCount }) => {
    const { id, queryInfo, rowCount, title } = model;
    const className = classNames({
        active: isActive,
        'pull-right': pullRight,
    });
    const onClick = useCallback(() => onSelect(id), [id, onSelect]);

    const rowCountDisplay = useMemo(() => {
        if (rowCount === undefined && !model.isActivelyLoadingTotalCount) return tabRowCount?.toLocaleString();
        return rowCount?.toLocaleString();
    }, [rowCount, tabRowCount, model]);

    return (
        <li className={className}>
            <a onClick={onClick}>
                {title || queryInfo?.queryLabel || queryInfo?.name}
                {showRowCount && rowCountDisplay !== undefined && <span> ({rowCountDisplay})</span>}
            </a>
        </li>
    );
});

export interface TabbedGridPanelProps<T = {}> extends GridPanelProps<T> {
    /**
     * The id of the model you want to render. Required if you are using onTabSelect. If passed when not using
     * onTabSelect it will be used as the initial active tab.
     */
    activeModelId?: string;
    /**
     * Defaults to true. Determines if we allow the grid view to be customized (e.g., columns added, removed, or relabeled)
     */
    allowViewCustomization?: boolean;
    /**
     * Determines which grid IDs to allow the grid view to be customized (e.g., columns added, removed, or relabeled)
     */
    allowViewCustomizationForGridIds?: string[];
    /**
     * By default, if there is only one model, the tabs will not be shown.  Setting this to true will show the tab
     * even if there is only one model.
     */
    alwaysShowTabs?: boolean;
    /**
     * Defaults to true. Determines if we render the TabbedGridPanel as a Bootstrap panel.
     */
    asPanel?: boolean;
    /**
     * Optional value to use as the filename prefix for the exported file, otherwise will default to 'Data'
     */
    exportFilename?: string;
    getAdvancedExportOptions?: (tabId: string) => { [key: string]: any };
    /**
     * return the custom GridPanel for an active tab
     * @param activeGridId
     */
    getGridPanelDisplay?: (
        activeGridId: string,
        exportHandlers: { [key: string]: (modelId?: string) => any }
    ) => React.ReactNode;
    /**
     * return the showViewMenu value for an active tab
     * @param activeGridId
     */
    getShowViewMenu?: (activeGridId: string) => boolean;
    /**
     * Optional, if used the TabbedGridPanel will act as a controlled component, requiring you to always pass the
     * activeModelId. If not passed the TabbedGridPanel will maintain the activeModelId state internally.
     * @param string
     */
    onTabSelect?: (modelId: string) => void;
    /**
     * The model IDs you want to render as tabs that are pulled to the right side of the tabs.
     */
    rightTabs?: string[];
    /**
     * Display the rowCount for each QueryModel as a part of the tab title. In order for this to display properly
     * for all tabs you'll need to ensure that all models are loaded upon rendering the TabbedGridPanel.
     * Defaults to false.
     */
    showRowCountOnTabs?: boolean;

    /**
     * Array of model ids representing the order you want the tabs in. This component will only render Tabs and
     * GridPanels for Query Models in the TabOrder array.
     */
    tabOrder: string[];

    /**
     * Provide the initial/default grid row count display for the QueryModel.id.
     * This count will only be displayed when queryModel.rowCount === undefined and !queryModel.isLoadingTotalCount
     */
    tabRowCounts?: { [key: string]: number };

    /**
     * The title to render, only used if asPanel is true.
     */
    title?: string;
}

export const TabbedGridPanel: FC<TabbedGridPanelProps & InjectedQueryModels> = memo(props => {
    const {
        activeModelId,
        actions,
        allowViewCustomization = true,
        allowViewCustomizationForGridIds,
        alwaysShowTabs,
        asPanel = true,
        onTabSelect,
        queryModels,
        rightTabs = [],
        showRowCountOnTabs,
        tabOrder,
        onExport,
        exportFilename,
        advancedExportOptions,
        getAdvancedExportOptions,
        getGridPanelDisplay,
        showViewMenu,
        getShowViewMenu,
        tabRowCounts,
        ...rest
    } = props;
    const [internalActiveId, setInternalActiveId] = useState<string>(activeModelId ?? tabOrder[0]);
    const [showExportModal, setShowExportModal] = useState<boolean>(false);
    const [canExport, setCanExport] = useState<boolean>(true);
    const onSelect = useCallback(
        (modelId: string) => {
            if (onTabSelect !== undefined) {
                onTabSelect(modelId);
            } else {
                setInternalActiveId(modelId);
            }
        },
        [onTabSelect]
    );

    // useNotificationsContext is only available if the app uses NotificationsContext, LKS does not
    let _createNotification;
    try {
        _createNotification = useNotificationsContext().createNotification;
    } catch (e) {
        // this is expected for LKS usages, so don't throw or console.error
    }

    // If the component is passed onTabSelect we will only honor the activeModelId passed to this component.
    let activeId = onTabSelect === undefined ? internalActiveId : activeModelId;

    // Default activeId if current activeId not in tabOrder
    activeId = tabOrder.indexOf(activeId) === -1 ? tabOrder[0] : activeId;

    const activeModel = queryModels[activeId];

    const exportTabs = useCallback(
        async (selectedTabs: string[] | Set<string>) => {
            try {
                // set exporting blocker
                setCanExport(false);
                const models = [];
                selectedTabs.forEach(selected => {
                    const selectedModel = queryModels[selected];
                    let exportOptions = { ...advancedExportOptions };
                    if (getAdvancedExportOptions) exportOptions = { ...getAdvancedExportOptions(selected) };
                    const tabForm = getQueryModelExportParams(selectedModel, EXPORT_TYPES.EXCEL, {
                        ...exportOptions,
                        sheetName: selectedModel.title,
                    });
                    models.push(tabForm);
                });
                const filename = exportFilename ?? 'Data';
                await exportTabsXlsx(filename, models);
                onExport?.[EXPORT_TYPES.EXCEL]?.();
                actions.addMessage(activeModel.id, { type: 'success', content: 'Excel export started.' }, 5000);
            } catch (e) {
                console.error(e);
                // Set export error
                _createNotification?.({ message: 'Export failed: ' + e, alertClass: 'danger' });
            } finally {
                // unset exporting blocker
                setCanExport(true);
                setShowExportModal(false);
            }
        },
        [
            actions,
            activeModel,
            exportFilename,
            canExport,
            _createNotification,
            queryModels,
            advancedExportOptions,
            getAdvancedExportOptions,
        ]
    );

    const excelExportHandler = useCallback(async () => {
        if (Object.keys(tabOrder).length > 1) {
            setShowExportModal(true);
            return;
        }

        try {
            await exportTabs([internalActiveId]);
        } catch (e) {
            console.error(e);
        }
    }, [tabOrder, exportTabs, internalActiveId]);

    const exportHandlers = { ...onExport, [EXPORT_TYPES.EXCEL]: excelExportHandler };

    const closeExportModal = useCallback(() => {
        setShowExportModal(false);
    }, []);

    const hasTabs = tabOrder.length > 1 || alwaysShowTabs;

    const showViewConfig = {}; // showViewMenu default to true in GridPanel
    if (getShowViewMenu || showViewMenu !== undefined) {
        showViewConfig['showViewMenu'] = getShowViewMenu ? getShowViewMenu(activeId) : showViewMenu;
    }

    const panelTitle = rest.title;
    if (asPanel && hasTabs) delete rest.title;

    const gridDisplay = getGridPanelDisplay?.(activeId, exportHandlers) ?? (
        <GridPanel
            allowViewCustomization={
                allowViewCustomizationForGridIds
                    ? allowViewCustomizationForGridIds.indexOf(activeId) > -1
                    : allowViewCustomization
            }
            key={activeId}
            actions={actions}
            hasHeader={!hasTabs}
            asPanel={!hasTabs}
            model={activeModel}
            onExport={exportHandlers}
            advancedExportOptions={
                getAdvancedExportOptions ? getAdvancedExportOptions(activeId) : advancedExportOptions
            }
            {...showViewConfig}
            {...rest}
        />
    );

    return (
        <>
            {hasTabs && (
                <div className={classNames('tabbed-grid-panel', { panel: asPanel, 'panel-default': asPanel })}>
                    {asPanel && panelTitle && <div className="panel-heading">{panelTitle}</div>}
                    <div className={classNames('tabbed-grid-panel__body', { 'panel-body': asPanel })}>
                        <ul className="nav nav-tabs">
                            {tabOrder.map(modelId => {
                                if (queryModels[modelId]) {
                                    return (
                                        <GridTab
                                            key={modelId}
                                            model={queryModels[modelId]}
                                            isActive={activeId === modelId}
                                            onSelect={onSelect}
                                            pullRight={rightTabs.indexOf(modelId) > -1}
                                            showRowCount={showRowCountOnTabs}
                                            tabRowCount={tabRowCounts?.[modelId]}
                                        />
                                    );
                                } else {
                                    return null;
                                }
                            })}
                        </ul>
                        {gridDisplay}
                    </div>
                </div>
            )}
            {!hasTabs && <>{gridDisplay}</>}
            {showExportModal && !!queryModels && (
                <ExportModal
                    queryModels={queryModels}
                    tabOrder={tabOrder}
                    onClose={closeExportModal}
                    onExport={exportTabs}
                    canExport={canExport}
                    tabRowCounts={tabRowCounts}
                />
            )}
        </>
    );
});
