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
import { storiesOf } from "@storybook/react";
import { boolean, number, select, text, withKnobs } from '@storybook/addon-knobs';
import { SampleDeleteConfirmModal } from "../components/samples/SampleDeleteConfirmModal";

import './stories.scss'
import { SampleDeleteConfirmation } from '..';

storiesOf('SampleDeleteConfirmModal', module)
    .add("Loading", () => {
        return <SampleDeleteConfirmation
            selectionKey={'nonesuch'}
            onConfirm={() => console.log('confirm')}
            onCancel={() => console.log('cancel')}
        />
    })
    .add("Cannot delete any", () => {
        return <SampleDeleteConfirmation
            selectionKey={'deleteNone'}
            onConfirm={() => console.log('confirm')}
            onCancel={() => console.log('cancel')}
            />
    })
    .add("Can delete one", () => {
        return <SampleDeleteConfirmation
            selectionKey={'deleteOne'}
            onConfirm={() => console.log('confirm')}
            onCancel={() => console.log('cancel')}
        />
    })
    .add("Can delete all", () => {
        return <SampleDeleteConfirmation
            selectionKey={'deleteAll'}
            onConfirm={() => console.log('confirm')}
            onCancel={() => console.log('cancel')}
        />
    })
    .add("Can delete some", () => {
        return <SampleDeleteConfirmation
            selectionKey={'deleteSome'}
            onConfirm={() => console.log('confirm')}
            onCancel={() => console.log('cancel')}
        />
    })
;