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
import { fromJS } from "immutable";
import { storiesOf } from "@storybook/react";
import { boolean, withKnobs } from '@storybook/addon-knobs'
import { AssayDefinitionModel } from "@glass/base";
import './stories.scss'
import { AssayReimportHeader } from '../components/assay/AssayReimportHeader';

import assayDefJSON from '../test/data/assayDefinitionModel.json';

storiesOf('AssayReimportHeader', module)
    .addDecorator(withKnobs)
    .add("with knobs", () => {

        const assay = AssayDefinitionModel.create(assayDefJSON);

        const runData = fromJS({
            'RowId': "10",
            'Name':  'Test Name'
        });
        return (
            <AssayReimportHeader
                hasBatchProperties={boolean("Has batch properties?", false)}
                assay={assay}
                replacedRunProperties={runData}
            />
        )
    });