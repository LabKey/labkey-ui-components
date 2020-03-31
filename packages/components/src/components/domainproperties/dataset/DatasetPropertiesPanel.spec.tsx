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

import {DatasetModel} from "./models";
import {NEW_DATASET_MODEL} from "../../../test/data/constants";
import getDatasetDesign from "../../../test/data/dataset-getDatasetDesign.json";
import React from "react";
import {DatasetPropertiesPanel} from "./DatasetPropertiesPanel";
import renderer from "react-test-renderer";

describe("Dataset Properties Panel", () => {

    const newDatasetModel = DatasetModel.create(NEW_DATASET_MODEL, undefined);
    const populatedDatasetModel = DatasetModel.create(null, getDatasetDesign);

    test("New dataset", () => {
        const propertiesPanel =
            <DatasetPropertiesPanel
                initCollapsed={false}
                model={newDatasetModel}
                controlledCollapse={true}
                useTheme={true}
                newDataset={true}
                showDataspace={true}
                panelStatus={'COMPLETE'}
                validate={false}
                onToggle={(collapsed, callback) => {}}
            />;
        const dom = renderer.create(propertiesPanel).toJSON();
        expect(dom).toMatchSnapshot();
    });

    test("Edit existing dataset", () => {
        const propertiesPanel =
            <DatasetPropertiesPanel
                initCollapsed={false}
                model={populatedDatasetModel}
                controlledCollapse={true}
                useTheme={true}
                newDataset={true}
                showDataspace={true}
                panelStatus={'COMPLETE'}
                validate={false}
                onToggle={(collapsed, callback) => {}}
            />;
        const dom = renderer.create(propertiesPanel).toJSON();
        expect(dom).toMatchSnapshot();
    });

});
