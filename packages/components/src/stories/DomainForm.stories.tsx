/*
 * Copyright (c) 2019-2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React, { useState } from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { DomainDesign } from '..';
import DomainForm, { DomainFormImpl } from '../internal/components/domainproperties/DomainForm';
import { MockLookupProvider } from '../test/components/Lookup';
import { PHILEVEL_RESTRICTED_PHI } from '../internal/components/domainproperties/constants';

import { disableControls } from './storyUtils';

import domainData from '../test/data/property-getDomain.json';
import errorData from '../test/data/property-saveDomainWithDuplicateField.json';
import warningData from '../test/data/property-unexpectedCharInFieldName.json';
import exceptionDataServer from '../test/data/property-domainExceptionFromServer.json';
import exceptionDataClient from '../test/data/property-domainExceptionClient.json';
import fullyLockedData from '../test/data/property-getDomainWithFullyLockedFields.json';
import partiallyLockedData from '../test/data/property-getDomainWithPartiallyLockedFields.json';

export default {
    title: 'Components/DomainForm',
    component: DomainForm,
    argTypes: {
        data: disableControls(),
        domain: disableControls(),
        exception: disableControls(),
        fieldsAdditionalRenderer: disableControls(),
        maxPhiLevel: disableControls(),
        onChange: disableControls(),
        onToggle: { action: 'toggle', ...disableControls() },
        setFileImportData: disableControls(),
    },
} as Meta;

const Template: Story = props => {
    const [domain, setDomain] = useState(() => DomainDesign.create(props.data ?? {}, props.exception));

    return (
        <MockLookupProvider>
            <DomainFormImpl
                {...(props as any)}
                domain={domain}
                maxPhiLevel={PHILEVEL_RESTRICTED_PHI}
                onChange={setDomain}
            />
        </MockLookupProvider>
    );
};

export const EmptyDomainStory = Template.bind({});
EmptyDomainStory.storyName = 'Empty domain';

export const InferFileStory = Template.bind({});
InferFileStory.storyName = 'Infer from file';

InferFileStory.args = {
    showInferFromFile: true,
};

export const DefaultDomainStory = Template.bind({});
DefaultDomainStory.storyName = 'With a domain';

DefaultDomainStory.args = {
    data: domainData,
};

export const FullyLockedStory = Template.bind({});
FullyLockedStory.storyName = 'Fully locked fields';

FullyLockedStory.args = {
    data: fullyLockedData,
};

export const PartiallyLockedStory = Template.bind({});
PartiallyLockedStory.storyName = 'Partially locked fields';

PartiallyLockedStory.args = {
    data: partiallyLockedData,
};

export const ServerSideErrorsStory = Template.bind({});
ServerSideErrorsStory.storyName = 'Server side errors and no file or flag types';

ServerSideErrorsStory.args = {
    data: errorData,
    exception: exceptionDataServer,
};

export const ClientSideErrorsStory = Template.bind({});
ClientSideErrorsStory.storyName = 'Client side errors and no file or flag types';

ClientSideErrorsStory.args = {
    data: warningData,
    exception: exceptionDataClient,
};
