/*
 * Copyright (c) 2020 LabKey Corporation
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

import React from 'react';

import { InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';

import { DatasetModel } from './models';
import { DatasetPropertiesPanel } from './DatasetPropertiesPanel';

interface Props {
    initModel?: DatasetModel;
    onChange?: (model: DatasetModel) => void;
    useTheme?: boolean;
    showDataSpace: boolean;
    showVisitDate: boolean;
}

interface State {
    model: DatasetModel;
}

export class DatasetDesignerPanelImpl extends React.PureComponent<Props & InjectedBaseDomainDesignerProps, State> {
    constructor(props: Props & InjectedBaseDomainDesignerProps) {
        super(props);

        this.state = {
            model: props.initModel || DatasetModel.create(null, {}),
        };
    }

    onPropertiesChange = (model: DatasetModel) => {
        const { onChange } = this.props;

        this.setState(
            () => ({ model }),
            () => {
                if (onChange) {
                    onChange(model);
                }
            }
        );
    };

    render() {
        const { useTheme, onTogglePanel, showDataSpace, showVisitDate } = this.props;

        const { model } = this.state;

        return (
            <>
                <DatasetPropertiesPanel
                    initCollapsed={false}
                    model={model}
                    controlledCollapse={true}
                    useTheme={useTheme}
                    panelStatus="COMPLETE"
                    validate={false}
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(0, collapsed, callback);
                    }}
                    onChange={this.onPropertiesChange}
                    showDataspace={showDataSpace}
                    showVisitDate={showVisitDate}
                />
            </>
        );
    }
}

export const DatasetDesignerPanels = withBaseDomainDesigner<Props>(DatasetDesignerPanelImpl);
