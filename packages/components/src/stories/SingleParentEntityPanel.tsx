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
import { withKnobs } from '@storybook/addon-knobs';
import './stories.scss';
import { DataClassDataType } from '..';
import { SingleParentEntityPanel } from '../components/entities/SingleParentEntityPanel';
import { fromJS } from 'immutable';

storiesOf('SingleParentEntityPanel', module)
    .addDecorator(withKnobs)
    .add("readonly", () => {
        return (
            <SingleParentEntityPanel
                parentDataType={DataClassDataType}
                parentTypeQueryName={"Second Source"}
                parentValue={fromJS({
                    displayValue: 'Sec-32',
                    value: "url:lsid:blah",
                    url: "/labkey/Sam%20Man/experiment-showData.view?rowId=57093&dataClassId=322"
                })}
                index={1}
            />
        )
    })
;
