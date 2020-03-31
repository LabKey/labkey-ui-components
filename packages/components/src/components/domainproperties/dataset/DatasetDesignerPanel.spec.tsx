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
import {DatasetDesignerPanel} from "./DatasetDesignerPanel";
import renderer from "react-test-renderer";
import React from "react";

describe("Dataset Designer", () => {

    const newDatasetModel = DatasetModel.create(NEW_DATASET_MODEL, undefined);
    const populatedDatasetModel = DatasetModel.create(null, getDatasetDesign);

    test("New dataset", () => {
        const designerPanel =
            <DatasetDesignerPanel
                initModel={newDatasetModel}
                useTheme={true}
                newDataset={true}
                showDataspace={true}
            />;

        const dom = renderer.create(designerPanel).toJSON();
        expect(dom).toMatchSnapshot();
    });

    test("Edit existing dataset", () => {
        const designerPanel =
            <DatasetDesignerPanel
                initModel={populatedDatasetModel}
                useTheme={true}
                newDataset={true}
                showDataspace={true}
            />;

        const dom = renderer.create(designerPanel).toJSON();
        expect(dom).toMatchSnapshot();
    })
});
