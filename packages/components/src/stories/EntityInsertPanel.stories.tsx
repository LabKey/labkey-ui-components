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

import { Location, EntityInsertPanel, helpLinkNode, DataClassDataType, SampleTypeDataType, EntityDataType } from '..';

import { List } from 'immutable';

storiesOf('EntityInsertPanel', module)
    .addDecorator(withKnobs)
    .add('No target sample set no parent data types', () => {
        return (
            <EntityInsertPanel
                entityDataType={SampleTypeDataType}
                canEditEntityTypeDetails={boolean('canEditEntityTypeDetails', true)}
                nounSingular={text('Singular noun', 'sample')}
                nounPlural={text('Plural noun', 'samples')}
                disableMerge={boolean('Disable merge?', false)}
            />
        );
    })
    .add('Target sample set without parent selections', () => {
        const location: Location = {
            query: {
                target: 'Sample Set 2',
            },
        };
        return (
            <EntityInsertPanel
                entityDataType={SampleTypeDataType}
                canEditEntityTypeDetails={boolean('canEditEntityTypeDetails', true)}
                nounSingular={text('Singular noun', 'sample')}
                nounPlural={text('Plural noun', 'samples')}
                location={location}
                importHelpLinkNode={helpLinkNode('help', 'help text')}
                parentDataTypes={List<EntityDataType>([SampleTypeDataType])}
            />
        );
    })
    .add('Multiple parent type options', () => {
        const location: Location = {
            query: {
                target: 'Sample Set 2',
            },
        };
        return (
            <EntityInsertPanel
                entityDataType={SampleTypeDataType}
                canEditEntityTypeDetails={boolean('canEditEntityTypeDetails', true)}
                nounSingular={text('Singular noun', 'sample')}
                nounPlural={text('Plural noun', 'samples')}
                location={location}
                importHelpLinkNode={helpLinkNode('help', 'help text')}
                parentDataTypes={List<EntityDataType>([
                    SampleTypeDataType,
                    {
                        ...DataClassDataType,
                        nounSingular: 'source',
                        nounPlural: 'sources',
                        descriptionSingular: 'source type',
                        descriptionPlural: 'source types',
                    },
                ])}
            />
        );
    });
