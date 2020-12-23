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

import { EntityTypeDeleteConfirmModal } from '..';

import './stories.scss';

storiesOf('EntityTypeDeleteConfirmModal', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        return (
            <EntityTypeDeleteConfirmModal
                rowId={0}
                noun={text('noun', 'sample')}
                deleteConfirmationActionName={text('lkDeleteAction', 'deleteSampleTypes')}
                showDependenciesLink={boolean('showDependenciesLink', false)}
                onConfirm={() => console.log('confirm')}
                onCancel={() => console.log('cancel')}
            />
        );
    });
