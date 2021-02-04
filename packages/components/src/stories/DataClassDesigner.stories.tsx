/*
 * Copyright (c) 2019-2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { DataClassDesigner, DataClassModel, IDomainField } from '..';

import getDomainDetailsJSON from '../test/data/dataclass-getDomainDetails.json';

import { disableControls } from './storyUtils';

const DEFAULT_NAME_FIELD_CONFIG = {
    name: 'SourceId',
} as Partial<IDomainField>;

export default {
    title: 'Components/DataClassDesigner',
    component: DataClassDesigner,
    argTypes: {
        onCancel: { action: 'cancelled', ...disableControls() },
        onComplete: { action: 'completed', ...disableControls() },
    },
} as Meta;

export const ForCreate: Story = storyProps => (
    <DataClassDesigner {...(storyProps as any)} initModel={DataClassModel.create({})} />
);

ForCreate.args = {
    appPropertiesOnly: false,
    successBsStyle: 'success',
};

export const ForUpdate: Story = props => (
    <DataClassDesigner
        {...(props as any)}
        defaultNameFieldConfig={DEFAULT_NAME_FIELD_CONFIG}
        initModel={DataClassModel.create(getDomainDetailsJSON)}
    />
);

ForUpdate.args = {
    appPropertiesOnly: true,
    headerText: 'Use source types to connect your samples to their biological or physical origins.',
    nameExpressionInfoUrl: 'https://www.labkey.org/Documentation',
    nameExpressionPlaceholder: 'Enter your source type naming pattern here...',
    nounPlural: 'Source',
    nounSingular: 'Source',
    successBsStyle: 'success',
};
