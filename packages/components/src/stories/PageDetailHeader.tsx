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
import { fromJS, Map } from 'immutable';
import { storiesOf } from '@storybook/react';
import { text, withKnobs } from '@storybook/addon-knobs';

import { PageDetailHeader } from '../internal/components/forms/PageDetailHeader';
import { CreatedModified } from '../internal/components/base/CreatedModified';

import { ICON_URL } from './mock';
import './stories.scss';

storiesOf('PageDetailHeader', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        const createdRow = Map<string, any>(
            fromJS({
                Created: {
                    formattedValue: '2019-05-15 19:45',
                    value: '2019-05-15 19:45:40.593',
                },
                CreatedBy: {
                    displayValue: 'username',
                    url: '#/q/core/siteusers/1001',
                    value: 1001,
                },
                Modified: {
                    formattedValue: '2019-05-16 19:45',
                    value: '2019-05-16 19:45:40.593',
                },
                ModifiedBy: {
                    displayValue: 'username2',
                    url: '#/q/core/siteusers/1002',
                    value: 1002,
                },
            })
        );

        return (
            <PageDetailHeader
                user={null}
                iconUrl={ICON_URL}
                title={text('title', 'Page Detail Header')}
                subTitle={text('subtitle', 'With a subtitle')}
            >
                <CreatedModified row={createdRow} />
            </PageDetailHeader>
        );
    });
