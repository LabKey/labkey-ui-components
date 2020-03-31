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
import {DatasetModel} from "./models";
import {DatasetPropertiesPanel} from "./DatasetPropertiesPanel";

interface DatasetDesignerPanelProps {
    initModel?: DatasetModel;
    useTheme?: boolean;
    newDataset: boolean;
    showDataspace: boolean;
}

export class DatasetDesignerPanel extends React.PureComponent<DatasetDesignerPanelProps> {
    constructor(props) {
        super(props);
    }

    render() {
        const { initModel, useTheme, newDataset, showDataspace } = this.props;

        return (
            <>
                <DatasetPropertiesPanel
                    initCollapsed={false}
                    model={initModel}
                    controlledCollapse={true}
                    useTheme={useTheme}
                    newDataset={newDataset}
                    showDataspace={showDataspace}
                    panelStatus={'COMPLETE'}
                    validate={false}
                    onToggle={(collapsed, callback) => {}} //TODO: handle in next story
                />
            </>
        );
    };
}
