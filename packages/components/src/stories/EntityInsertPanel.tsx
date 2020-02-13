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
import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';
import { Location } from '../util/URL';

import { EntityInsertPanel } from '../components/entities/EntityInsertPanel';

import './stories.scss';
import { EntityDataType } from '..';

storiesOf('EntityInsertPanel', module)
    .addDecorator(withKnobs)
    .add("No target sample set", () => {
        return <EntityInsertPanel
            entityDataType={EntityDataType.Sample}
            canEditEntityTypeDetails={boolean('canEditEntityTypeDetails', true)}
            nounSingular={text("Singular noun", "sample")}
            nounPlural={text("Plural noun", "samples")}
        />;

    })
    .add("Target sample set without parent selections", () => {
        const location : Location = {
            query: {
                target: "Sample Set 2"
            }
        };
        return <EntityInsertPanel
            entityDataType={EntityDataType.Sample}
            canEditEntityTypeDetails={boolean('canEditEntityTypeDetails', true)}
            location={location}
        />;
    })
    // TODO Somehow not all the queries or data or something is right for the use of this selectionKey.
    // .add("Target sample set with parent selection", () => {
    //     const location : Location = {
    //         query: {
    //             target: "Sample Set 2",
    //             selectionKey:"sample-set-name%20expression%20set|samples/name%20expression%20set"
    //         }
    //     };
    //     return <SampleInsertPage
    //         location={location}
    //     />;
    // })
;
