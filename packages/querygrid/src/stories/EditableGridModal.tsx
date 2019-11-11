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
import * as React from 'react';
import { storiesOf } from "@storybook/react";
import { boolean, text, withKnobs } from '@storybook/addon-knobs';
import { SchemaQuery } from "@glass/base";
import { getStateQueryGridModel } from "../models";

import './stories.scss'
import { EditableGridLoader, EditableGridModal } from "..";


storiesOf('EditableGridModal', module)
    .addDecorator(withKnobs)
    .add("with knobs", () => {
        const modelId = "editableModal";
        const schemaQuery = new SchemaQuery({
            schemaName: "exp.data",
            queryName: "mixtures"
        });
        const model = getStateQueryGridModel(modelId, schemaQuery, {
            loader: new EditableGridLoader(),
            editable: true
        });
        return (
            <EditableGridModal
                model={model}
                allowRemove={boolean("Allow remove", false)}
                show={boolean("Show modal?", true)}
                title={text("Title", "Editable modal")}
                onCancel={() => console.log("Cancel")}
                onSave={() => console.log("Save changes")}
                cancelText={text("Cancel text", undefined)}
                saveText={text("Save text", undefined)}
            />
        );

    })
;