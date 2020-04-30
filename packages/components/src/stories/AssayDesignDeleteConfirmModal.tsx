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
import { number, text, withKnobs } from '@storybook/addon-knobs';

import './stories.scss';
import { AssayDesignDeleteConfirmModal } from '..';

storiesOf('AssayDesignDeleteConfirmModal', module)
    .addDecorator(withKnobs)
    .add('without assay design name', () => {
        return (
            <AssayDesignDeleteConfirmModal
                onConfirm={() => console.log('confirm')}
                onCancel={() => console.log('cancel')}
            />
        );
    })
    .add('with assay design name', () => {
        return (
            <AssayDesignDeleteConfirmModal
                assayDesignName={text('Assay Design Name', 'GPAT-10')}
                onConfirm={() => console.log('confirm')}
                onCancel={() => console.log('cancel')}
            />
        );
    })
    .add('with runs', () => {
        return (
            <AssayDesignDeleteConfirmModal
                numRuns={number('Number of runs', 3)}
                onConfirm={() => console.log('confirm')}
                onCancel={() => console.log('cancel')}
            />
        );
    });
