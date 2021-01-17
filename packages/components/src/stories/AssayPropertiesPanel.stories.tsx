/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { AssayProtocolModel, AssayPropertiesPanel } from '..';

import initGlobal from './initGlobal';

import generalAssayTemplate from '../test/data/assay-getProtocolGeneralTemplate.json';
import generalAssaySaved from '../test/data/assay-getProtocolGeneral.json';
import elispotAssayTemplate from '../test/data/assay-getProtocolELISpotTemplate.json';
import elispotAssaySaved from '../test/data/assay-getProtocolELISpot.json';

const DATA_MODELS = {
    'GPAT Template': generalAssayTemplate.data,
    'GPAT Saved Assay': generalAssaySaved.data,
    'ELISpot Template': elispotAssayTemplate.data,
    'ELISpot Saved Assay': elispotAssaySaved.data,
};

// TODO: This needs to be reinitialized every time data changes...
initGlobal();

export default {
    title: 'Components/AssayPropertiesPanel',
    component: AssayPropertiesPanel,
    argTypes: {
        data: {
            control: {
                type: 'select',
                options: Object.keys(DATA_MODELS),
            },
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

export const AssayPropertiesPanelStory: Story = props => {
    const dataModel = useMemo(() => AssayProtocolModel.create(DATA_MODELS[props.data]), [props.data]);
    const [model, setModel] = useState(dataModel);

    useEffect(() => {
        setModel(dataModel);
    }, [dataModel]);

    return <AssayPropertiesPanel {...(props as any)} key={props.data} model={model} onChange={setModel} />;
};

AssayPropertiesPanelStory.storyName = 'AssayPropertiesPanel';

AssayPropertiesPanelStory.args = {
    appPropertiesOnly: true,
    asPanel: true,
    collapsible: true,
    controlledCollapse: false,
    data: 'GPAT Template',
    initCollapsed: false,
    model: AssayProtocolModel.create(generalAssayTemplate.data),
    panelStatus: 'NONE',
    useTheme: false,
    validate: false,
};
