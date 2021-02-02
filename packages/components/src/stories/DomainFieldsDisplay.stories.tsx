/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { DomainFieldsDisplay, DomainDesign } from '..';

import data from '../test/data/property-getDomain.json';

import { disableControls } from './storyUtils';

export default {
    title: 'Components/DomainFieldsDisplay',
    component: DomainFieldsDisplay,
    argTypes: {
        domain: {
            control: disableControls(),
            table: disableControls(),
        },
    },
} as Meta;

const Template: Story = storyProps => <DomainFieldsDisplay {...(storyProps as any)} />;

export const EmptyDomain = Template.bind({});
EmptyDomain.args = {
    domain: new DomainDesign(),
    title: 'Empty Domain Properties Example',
};

export const DomainWithData = Template.bind({});
DomainWithData.args = {
    domain: new DomainDesign(data),
    title: 'Study Properties',
};
