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
import React, { Component } from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import {
    getStateQueryGridModel,
    gridInit,
    DetailEditing,
    getQueryGridModel,
    LoadingSpinner,
    QueryGridModel,
    SCHEMAS,
    SchemaQuery,
} from '..';

import initGlobal from './initGlobal';

initGlobal();

export default {
    title: 'Components/DetailEditing',
    component: DetailEditing,
    argTypes: {
        onEditToggle: {
            action: 'editToggle',
            control: { disable: true },
            table: { disable: true },
        },
        onUpdate: {
            action: 'update',
            control: { disable: true },
            table: { disable: true },
        },
        queryColumns: {
            control: { disable: true },
            table: { disable: true },
        },
        queryModel: {
            control: { disable: true },
            table: { disable: true },
        },
    },
} as Meta;

class DetailEditingPage extends Component {
    componentDidMount(): void {
        gridInit(this.getQueryGridModel(), true, this);
    }

    getQueryGridModel(): QueryGridModel {
        const model = getStateQueryGridModel(
            'detailediting',
            SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'Samples'),
            {},
            123
        );
        return getQueryGridModel(model.getId()) || model;
    }

    render() {
        const queryModel = this.getQueryGridModel();

        if (!queryModel?.isLoaded) {
            return <LoadingSpinner />;
        }

        return <DetailEditing {...(this.props as any)} queryModel={queryModel} />;
    }
}

const DetailEditingStory: Story = props => <DetailEditingPage {...(props as any)} />;

export const DetailEditingEditable = DetailEditingStory.bind({});
DetailEditingEditable.storyName = 'Editable';

DetailEditingEditable.args = {
    canUpdate: true,
    title: 'Details',
};
