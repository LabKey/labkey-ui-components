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
import {getDomainPanelStatus} from "../actions";
import {ListPropertiesPanel} from "../list/ListPropertiesPanel";
import {DatasetPropertiesPanel} from "./DatasetPropertiesPanel";
import {DatasetModel} from "./models";

interface DatasetDesignerPanelProps {
    initModel?: DatasetModel
}

interface DatasetDesignerPanelState {

}

export class DatasetDesignerPanel extends React.PureComponent<DatasetDesignerPanelProps, DatasetDesignerPanelState> {
    constructor(props) {
        super(props);
    }

    render() {
        const { initModel } = this.props;

        return (
            <>
                <DatasetPropertiesPanel
                    model={initModel}
                    controlledCollapse={true}
                />
            </>
        );
    };
}
