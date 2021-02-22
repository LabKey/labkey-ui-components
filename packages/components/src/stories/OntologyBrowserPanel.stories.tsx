import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';
import { disableControls } from './storyUtils';

import {
    OntologyBrowserPanelImpl,
    OntologyBrowserPanelImplProps,
} from '../internal/components/ontology/OntologyBrowserPanel';
import { OntologyModel, PathModel } from '../internal/components/ontology/models';

export default {
    title: 'Components/OntologyBrowserPanel',
    component: OntologyBrowserPanelImpl,
    argTypes: {
        setSelectedConcept: disableControls(),
    },
} as Meta;

const mockRoot = new PathModel({
    path: '/NCIT/',
    code: 'NCIT',
    label: 'Ontologies',
    hasChildren: true,
    children: [],
});

const baseOntologyModel = new OntologyModel({
    name: mockRoot.label,
    conceptCount: 160426,
    abbreviation: mockRoot.code,
    description: 'Test ontology description',
    rowId: 42,
    path: mockRoot.path,
});

export const OntologyBrowserPanelStory: Story<OntologyBrowserPanelImplProps> = props => (
    <OntologyBrowserPanelImpl {...(props as any)} />
);

OntologyBrowserPanelStory.storyName = 'OntologyBrowserPanel';

OntologyBrowserPanelStory.args = {
    ontology: baseOntologyModel,
    selectedConcept: undefined,
    setSelectedConcept: (conceptCode => console.log(conceptCode))
};
