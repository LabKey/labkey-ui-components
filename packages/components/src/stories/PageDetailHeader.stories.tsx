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
import { text, withKnobs } from '@storybook/addon-knobs';

import { PageDetailHeader, CreatedModified } from '..';

import { ICON_URL } from './mock';

storiesOf('PageDetailHeader', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        const createdRow = {
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
        };

        return (
            <PageDetailHeader
                user={null}
                iconUrl={ICON_URL}
                title={text('title', 'Page Detail Header')}
                subTitle={text('subtitle', 'With a subtitle')}
                description={'With a description\nThat has a newline in it\nwhich extends below the image.'}
            >
                <CreatedModified row={createdRow} />
            </PageDetailHeader>
        );
    });
