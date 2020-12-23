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
import { boolean, withKnobs } from '@storybook/addon-knobs';

import './stories.scss';
import { List } from 'immutable';

import { DataClassDataType, IEntityTypeOption } from '..';
import { SingleParentEntityPanel } from '../internal/components/entities/SingleParentEntityPanel';

const parentTypeOptions = List<IEntityTypeOption>([
    {
        label: 'Second Source',
        lsid: 'urn:lsid:labkey.com:DataClass.Folder-252:Second+Source',
        rowId: 322,
        value: 'second source',
        query: 'Second Source',
        schema: 'exp.data',
    },
    {
        label: 'Source 1',
        lsid: 'urn:lsid:labkey.com:DataClass.Folder-252:Source+1',
        rowId: 321,
        value: 'source 1',
        query: 'Source 1',
        schema: 'exp.data',
    },
    {
        label: 'Vendor 3',
        lsid: 'urn:lsid:labkey.com:DataClass.Folder-252:Vendor+3',
        rowId: 323,
        value: 'vendor 3',
        query: 'Vendor 3',
        schema: 'exp.data',
    },
]);

storiesOf('SingleParentEntityPanel', module)
    .addDecorator(withKnobs)
    .add('No parents', () => {
        return (
            <SingleParentEntityPanel
                childNounSingular="Sample"
                parentDataType={DataClassDataType}
                parentLSIDs={undefined}
                parentTypeOptions={parentTypeOptions}
                parentTypeQueryName={undefined}
                index={0}
                editing={boolean('Editing? ', false)}
            />
        );
    })
    .add('single parent', () => {
        return (
            <SingleParentEntityPanel
                childNounSingular="Sample"
                parentDataType={{ ...DataClassDataType, appUrlPrefixParts: ['sources'] }}
                parentTypeQueryName="Second Source"
                parentLSIDs={['url:lsid:blah']}
                parentTypeOptions={parentTypeOptions}
                index={0}
                editing={boolean('Editing? ', false)}
                onRemoveParentType={() => {
                    console.log('No really removing anything.');
                }}
            />
        );
    });
