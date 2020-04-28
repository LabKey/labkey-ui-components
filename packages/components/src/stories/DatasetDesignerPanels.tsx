/*
 * Copyright (c) 2020 LabKey Corporation
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

import { NEW_DATASET_MODEL_WITH_DATASPACE, NEW_DATASET_MODEL_WITHOUT_DATASPACE } from '../test/data/constants';
import { DatasetDesignerPanels } from '../components/domainproperties/dataset/DatasetDesignerPanels';
import { DatasetModel } from '../components/domainproperties/dataset/models';
import getDatasetDesign from '../test/data/dataset-getDatasetDesign.json';
import getDatasetDesignSharedStudy from '../test/data/dataset-getDatasetDesignSharedStudy.json';

storiesOf('DatasetDesigner', module)
    .addDecorator(withKnobs)
    .add('create new dataset without dataspace', () => {
        return (
            <DatasetDesignerPanels
                initModel={DatasetModel.create(NEW_DATASET_MODEL_WITHOUT_DATASPACE, undefined)}
                useTheme={false}
                saveBtnText={text('saveBtnText', 'Save')}
                successBsStyle={text('successBsStyle', undefined)}
                onCancel={() => console.log('cancel')}
                onComplete={() => console.log('onComplete')}
            />
        );
    })
    .add('create new dataset with dataspace', () => {
        return (
            <DatasetDesignerPanels
                initModel={DatasetModel.create(NEW_DATASET_MODEL_WITH_DATASPACE, undefined)}
                useTheme={false}
                saveBtnText={text('saveBtnText', 'Save')}
                successBsStyle={text('successBsStyle', undefined)}
                onCancel={() => console.log('cancel')}
                onComplete={() => console.log('onComplete')}
            />
        );
    })
    .add('edit dataset without dataspace', () => {
        return (
            <DatasetDesignerPanels
                initModel={DatasetModel.create(null, getDatasetDesign)}
                useTheme={false}
                saveBtnText={text('saveBtnText', 'Save')}
                successBsStyle={text('successBsStyle', undefined)}
                onCancel={() => console.log('cancel')}
                onComplete={() => console.log('onComplete')}
            />
        );
    })
    .add('edit dataset with dataspace', () => {
        return (
            <DatasetDesignerPanels
                initModel={DatasetModel.create(null, getDatasetDesignSharedStudy)}
                useTheme={false}
                saveBtnText={text('saveBtnText', 'Save')}
                successBsStyle={text('successBsStyle', undefined)}
                onCancel={() => console.log('cancel')}
                onComplete={() => console.log('onComplete')}
            />
        );
    });
