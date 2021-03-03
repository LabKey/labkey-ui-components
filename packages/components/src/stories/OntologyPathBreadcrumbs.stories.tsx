import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { OntologyPathBreadcrumb, OntologyPathBreadcrumbProps } from '../internal/components/ontology/OntologyPathBreadcrumbs';

import {} from './storyUtils';

export default {
    title: 'Components/OntologyPathBreadcrumb',
    component: OntologyPathBreadcrumb,
    // argTypes: {
    // }
} as Meta;

export const OntologyPathBreadcrumbsStory: Story<OntologyPathBreadcrumbProps> = props => (
    <OntologyPathBreadcrumb {...props} />
);

OntologyPathBreadcrumbsStory.storyName = 'OntologyPathBreadcrumb';
OntologyPathBreadcrumbsStory.args = {
    selectedPath: ['abcd', 'efg', '123 456 789'],
};
