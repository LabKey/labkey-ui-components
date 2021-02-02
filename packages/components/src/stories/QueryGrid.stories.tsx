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
import React, { useMemo } from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { getStateQueryGridModel, SchemaQuery } from '..';
import { QueryGrid } from '../internal/components/QueryGrid';
import { disableControls, initGlobal } from './storyUtils';

initGlobal();

export default {
    title: 'Components/QueryGrid',
    component: QueryGrid,
    argTypes: {
        allowSelection: disableControls(),
        highlightLastSelectedRow: disableControls(),
        model: disableControls(),
        modelId: disableControls(),
        onSelectionChange: { action: 'selectionChange', ...disableControls() },
        schemaQuery: disableControls(),
    },
} as Meta;

const Template: Story = props => {
    const { modelId, schemaQuery } = props;
    const model = useMemo(() => {
        return getStateQueryGridModel(modelId, schemaQuery, () => ({
            allowSelection: false,
        }));
    }, [modelId, schemaQuery]);

    return <QueryGrid model={model} />;
};

export const NoDataStory = Template.bind({});
NoDataStory.storyName = 'No data available';

NoDataStory.args = {
    modelId: 'basicRendering',
    schemaQuery: SchemaQuery.create('schema', 'q-snapshot'),
};

export const WithoutData = Template.bind({});
WithoutData.storyName = 'Without data';

WithoutData.args = {
    modelId: 'gridWithoutData',
    schemaQuery: SchemaQuery.create('schema', 'gridWithoutData'),
};

export const WithData = Template.bind({});
WithData.storyName = 'With data';

WithData.args = {
    modelId: 'gridWithData',
    schemaQuery: SchemaQuery.create('exp.data', 'mixtures'),
};

export const WithMessage = Template.bind({});
WithMessage.storyName = 'With message';

WithMessage.args = {
    modelId: 'gridWithMessage',
    schemaQuery: SchemaQuery.create('assay.General.Amino Acids', 'Runs'),
};
