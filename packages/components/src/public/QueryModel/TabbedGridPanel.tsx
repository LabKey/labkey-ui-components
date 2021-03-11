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
import React, { FC, memo, useCallback, useState } from 'react';
import classNames from 'classnames';

import { QueryModel } from './QueryModel';
import { InjectedQueryModels } from './withQueryModels';
import { GridPanel, GridPanelProps } from './GridPanel';

interface GridTabProps {
    isActive: boolean;
    model: QueryModel;
    onSelect: (id: string) => void;
    pullRight: boolean;
}

const GridTab: FC<GridTabProps> = memo(({ isActive, model, onSelect, pullRight }) => {
    const { id, queryInfo, title } = model;
    const className = classNames({
        active: isActive,
        'pull-right': pullRight,
    });
    const onClick = useCallback(() => onSelect(id), [id, onSelect]);

    return (
        <li className={className}>
            <a onClick={onClick}>{title || queryInfo?.queryLabel || queryInfo?.name}</a>
        </li>
    );
});

interface TabbedGridPanelProps<T = {}> extends GridPanelProps<T> {
    /**
     * The id of the model you want to render. Required if you are using onTabSelect. If passed when not using
     * onTabSelect it will be used as the initial active tab.
     */
    activeModelId?: string;
    /**
     * Defaults to true. Determines if we render the TabbedGridPanel as a Bootstrap panel.
     */
    asPanel?: boolean;
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
     * Array of model ids representing the order you want the tabs in. This component will only render Tabs and
     * GridPanels for Query Models in the TabOrder array.
     */
    tabOrder: string[];
    /**
     * The title to render, only used if asPanel is true.
     */
    title?: string;
}

export const TabbedGridPanel: FC<TabbedGridPanelProps & InjectedQueryModels> = memo(props => {
    const {
        activeModelId,
        actions,
        asPanel = true,
        onTabSelect,
        queryModels,
        rightTabs = [],
        title,
        tabOrder,
        ...rest
    } = props;
    const [internalActiveId, setInternalActiveId] = useState<string>(activeModelId ?? tabOrder[0]);
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
    // If the component is passed onTabSelect we will only honor the activeModelId passed to this component.
    let activeId = onTabSelect === undefined ? internalActiveId : activeModelId;

    // Default activeId if current activeId not in tabOrder
    activeId = tabOrder.indexOf(activeId) === -1 ? tabOrder[0] : activeId;

    const activeModel = queryModels[activeId];

    return (
        <div className={classNames('tabbed-grid-panel', { panel: asPanel, 'panel-default': asPanel })}>
            {title !== undefined && asPanel && <div className="tabbed-grid-panel__title panel-heading">{title}</div>}

            <div className={classNames('tabbed-grid-panel__body', { 'panel-body': asPanel })}>
                {tabOrder.length > 1 && (
                    <ul className="nav nav-tabs">
                        {tabOrder.map(modelId => (
                            <GridTab
                                key={modelId}
                                model={queryModels[modelId]}
                                isActive={activeId === modelId}
                                onSelect={onSelect}
                                pullRight={rightTabs.indexOf(modelId) > -1}
                            />
                        ))}
                    </ul>
                )}

                <GridPanel key={activeId} actions={actions} asPanel={false} model={activeModel} {...rest} />
            </div>
        </div>
    );
});
