import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';
import { disableControls } from './storyUtils';

import {
    OntologyBrowserPanelImpl,
    OntologyBrowserPanelImplProps,
} from '../internal/components/ontology/OntologyBrowserPanel';
import { ConceptModel, OntologyModel, PathModel } from '../internal/components/ontology/models';

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

const ontology = new OntologyModel({
    name: mockRoot.label,
    conceptCount: 160426,
    abbreviation: mockRoot.code,
    description: 'Test ontology description',
    rowId: 42,
    path: mockRoot.path,
});

const selectedConcept = new ConceptModel({
    code: 'NCIT:ST1000003',
    label: 'Cell or Molecular Dysfunction',
    description: 'This is the description for the Cell or Molecular Dysfunction code.',
});

export const OntologyBrowserPanelStory: Story<OntologyBrowserPanelImplProps> = props => (
    <OntologyBrowserPanelImpl {...(props as any)} />
);

OntologyBrowserPanelStory.storyName = 'OntologyBrowserPanel';

OntologyBrowserPanelStory.args = {
    ontology,
    selectedConcept,
    setSelectedConcept: (conceptCode => console.log(conceptCode))
};
