import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';
import { disableControls } from './storyUtils';

import {
    OntologyBrowserPanel,
    OntologyBrowserProps,
} from '../internal/components/ontology/OntologyBrowserPanel';

export default {
    title: 'Components/OntologyBrowserPanel',
    component: OntologyBrowserPanel,
    argTypes: {
        initOntologyId: disableControls(),
        onConceptSelect: disableControls(),
    },
} as Meta;

export const OntologyBrowserPanelStory: Story<OntologyBrowserProps> = props => (
    <OntologyBrowserPanel {...props} initOntologyId={props.withOntology ? 'NCIT' : undefined} />
);

OntologyBrowserPanelStory.storyName = 'OntologyBrowserPanel';

OntologyBrowserPanelStory.args = {
    // story only props
    withOntology: true,
};
