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
import { storiesOf } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';
import { NEW_DATASET_MODEL } from "../test/data/constants";
import { DatasetDesignerPanels } from "../components/domainproperties/dataset/DatasetDesignerPanels";
import { DatasetModel } from "../components/domainproperties/dataset/models";
import getDatasetDesign from '../test/data/dataset-getDatasetDesign.json';

class NewDatasetDesigner extends React.PureComponent<any,any> {
    constructor(props) {
        super(props);
    }

    render() {
        return (
          <DatasetDesignerPanels
              initModel={DatasetModel.create(this.props.model, undefined)}
              useTheme={this.props.useTheme}
              onCancel={() => console.log('cancel')}
              onComplete={() => console.log('onComplete')}
          />
        );
    }
}

class EditDatasetDesigner extends React.PureComponent<any,any> {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <DatasetDesignerPanels
                initModel={DatasetModel.create(null, this.props.model)}
                useTheme={this.props.useTheme}
                onCancel={() => console.log('cancel')}
                onComplete={() => console.log('onComplete')}
            />
        );
    }
}

storiesOf("DatasetDesigner", module)
    .addDecorator(withKnobs)
    .add("create new dataset without dataspace", () => {
        return (
            <NewDatasetDesigner
                model={NEW_DATASET_MODEL}
                useTheme={false}
                showVisitDate={true}
            />
        )
    })
    .add("create new dataset with dataspace", () => {
        return (
            <NewDatasetDesigner
                model={NEW_DATASET_MODEL}
                useTheme={false}
            />
        )
    })
    .add("edit dataset without dataspace" ,() => {
        return (
            <EditDatasetDesigner
                model={getDatasetDesign}
                useTheme={false}
            />
        )
    })
    .add("edit dataset with dataspace" ,() => {
        return (
            <EditDatasetDesigner
                model={getDatasetDesign}
                useTheme={false}
            />
        )
    });
