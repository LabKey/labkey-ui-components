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

import { NEW_DATASET_MODEL } from "../../../test/data/constants";
import {DatasetModel} from "./models";
import {AdvancedSettings} from "./DatasetPropertiesAdvancedSettings";
import React from "react";
import renderer from "react-test-renderer";

const newDatasetModel = DatasetModel.create(NEW_DATASET_MODEL, undefined);

describe("Dataset Advanced Settings", () => {

    test("New Dataset, without dataspace options", () => {
       const datasetAdvancedSetting =
           <AdvancedSettings
               title={"Advanced Settings"}
               model={newDatasetModel}
               newDataset={true}
               showDataspace={false}
           />;

       const dom = renderer.create(datasetAdvancedSetting).toJSON();
       expect(dom).toMatchSnapshot();

   });

    test("New Dataset, with dataspace options", () => {
        const datasetAdvancedSetting =
            <AdvancedSettings
                title={"Advanced Settings"}
                model={newDatasetModel}
                newDataset={true}
                showDataspace={true}
            />;

        const dom = renderer.create(datasetAdvancedSetting).toJSON();
        expect(dom).toMatchSnapshot();

    });

    test("Edit Dataset", () => {

    });

});
