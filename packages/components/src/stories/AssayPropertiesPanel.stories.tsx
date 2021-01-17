/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React, { useState } from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { AssayProtocolModel, AssayPropertiesPanel } from '..';

import initGlobal from './initGlobal';

import generalAssayTemplate from '../test/data/assay-getProtocolGeneralTemplate.json';
import generalAssaySaved from '../test/data/assay-getProtocolGeneral.json';
import elispotAssayTemplate from '../test/data/assay-getProtocolELISpotTemplate.json';
import elispotAssaySaved from '../test/data/assay-getProtocolELISpot.json';

initGlobal();

export default {
    title: 'Components/AssayPropertiesPanel',
    component: AssayPropertiesPanel,
    argTypes: {
        dataModel: {
            control: { disable: true },
            table: { disable: true },
        },
        model: {
            control: { disable: true },
            table: { disable: true },
        },
        onChange: {
            control: { disable: true },
            table: { disable: true },
        },
    },
} as Meta;

const Template: Story = ({ dataModel, ...rest }) => {
    const [model, setModel] = useState(dataModel);
    return <AssayPropertiesPanel {...rest} model={model} onChange={setModel} />;
};

export const GPATTemplateStory = Template.bind({});
GPATTemplateStory.storyName = 'GPAT Template';

GPATTemplateStory.args = {
    appPropertiesOnly: true,
    asPanel: true,
    collapsible: true,
    controlledCollapse: false,
    initCollapsed: false,
    dataModel: AssayProtocolModel.create(generalAssayTemplate.data),
    panelStatus: 'NONE',
    useTheme: false,
    validate: false,
};

export const GPATSavedAssayStory = Template.bind({});
GPATSavedAssayStory.storyName = 'GPAT Saved Assay';

GPATSavedAssayStory.args = {
    ...GPATTemplateStory.args,
    dataModel: AssayProtocolModel.create(generalAssaySaved.data),
};

export const ELISpotTemplateStory = Template.bind({});
ELISpotTemplateStory.storyName = 'ELISpot Template';

ELISpotTemplateStory.args = {
    ...GPATTemplateStory.args,
    dataModel: AssayProtocolModel.create(elispotAssayTemplate.data),
};

export const ELISpotSavedAssayStory = Template.bind({});
ELISpotSavedAssayStory.storyName = 'ELISpot Saved Assay';

ELISpotSavedAssayStory.args = {
    ...GPATTemplateStory.args,
    dataModel: AssayProtocolModel.create(elispotAssaySaved.data),
};
