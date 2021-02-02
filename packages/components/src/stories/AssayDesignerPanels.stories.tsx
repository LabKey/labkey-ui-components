/*
 * Copyright (c) 2019-2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';
import { fromJS } from 'immutable';

import { AssayProtocolModel, AssayDesignerPanels, Alert } from '..';
import { DomainException } from '../internal/components/domainproperties/models';
import { setAssayDomainException } from '../internal/components/domainproperties/assay/actions';
import { SEVERITY_LEVEL_ERROR } from '../internal/components/domainproperties/constants';

import { initGlobal } from './storyUtils';

import generalAssayTemplate from '../test/data/assay-getProtocolGeneralTemplate.json';
import generalAssaySaved from '../test/data/assay-getProtocolGeneral.json';
import generalAssayDupes from '../test/data/assay-getProtocolGeneralDuplicateFields.json';
import domainAssayException from '../test/data/assay-domainExceptionFromServer.json';
import elispotAssayTemplate from '../test/data/assay-getProtocolELISpotTemplate.json';
import elispotAssaySaved from '../test/data/assay-getProtocolELISpot.json';

initGlobal();

const APP_DOMAIN_HEADERS = fromJS({
    Batch: () => <Alert bsStyle="info">This is a mock batch app header.</Alert>,
    Data: () => <Alert bsStyle="info">This is a mock results app header.</Alert>,
    Run: () => <Alert bsStyle="info">This is a mock run app header.</Alert>,
});

export default {
    title: 'Components/AssayDesignerPanels',
    component: AssayDesignerPanels,
    argTypes: {
        initModel: {
            control: { disable: true },
            table: { disable: true },
        },
        model: {
            control: { disable: true },
            table: { disable: true },
        },
        onCancel: {
            action: 'cancel',
            control: { disable: true },
            table: { disable: true },
        },
        onChange: {
            action: 'change',
            control: { disable: true },
            table: { disable: true },
        },
        onComplete: {
            action: 'complete',
            control: { disable: true },
            table: { disable: true },
        },
    },
} as Meta;

const Template: Story = ({ model, ...rest }) => (
    <AssayDesignerPanels {...rest} appDomainHeaders={APP_DOMAIN_HEADERS} initModel={model} />
);

export const GPATTemplateStory = Template.bind({});
GPATTemplateStory.storyName = 'GPAT Template';

GPATTemplateStory.args = {
    appPropertiesOnly: false,
    hideEmptyBatchDomain: false,
    model: AssayProtocolModel.create(generalAssayTemplate.data),
    successBsStyle: 'success',
    useTheme: false,
};

export const GPATSavedAssayStory = Template.bind({});
GPATSavedAssayStory.storyName = 'GPAT Saved Assay';

GPATSavedAssayStory.args = {
    ...GPATTemplateStory.args,
    model: AssayProtocolModel.create(generalAssaySaved.data),
};

export const GPATAssayWithErrorsStory = Template.bind({});
GPATAssayWithErrorsStory.storyName = 'GPAT Assay With Errors';

GPATAssayWithErrorsStory.args = {
    ...GPATTemplateStory.args,
    model: ((): AssayProtocolModel => {
        const model = AssayProtocolModel.create(generalAssayDupes.data);
        const exception = DomainException.create(domainAssayException, SEVERITY_LEVEL_ERROR);
        return setAssayDomainException(model, exception);
    })(),
};

export const ELISpotTemplateStory = Template.bind({});
ELISpotTemplateStory.storyName = 'ELISpot Template';

ELISpotTemplateStory.args = {
    ...GPATTemplateStory.args,
    model: AssayProtocolModel.create(elispotAssayTemplate.data),
};

export const ELISpotSavedAssayStory = Template.bind({});
ELISpotSavedAssayStory.storyName = 'ELISpot Saved Assay';

ELISpotSavedAssayStory.args = {
    ...GPATTemplateStory.args,
    model: AssayProtocolModel.create(elispotAssaySaved.data),
};
