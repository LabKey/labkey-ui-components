import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { ConceptPathDisplay, ConceptPathDisplayProps } from '../internal/components/ontology/ConceptPath';

import {} from './storyUtils';
import { PathModel } from '../internal/components/ontology/models';

export default {
    title: 'Components/ConceptPathDisplay',
    component: ConceptPathDisplay,
} as Meta;

export const OntologyConceptPathDisplay: Story<ConceptPathDisplayProps> = props => (
    <ConceptPathDisplay {...props} />
);

OntologyConceptPathDisplay.storyName = 'OntologyPathBreadcrumb';
OntologyConceptPathDisplay.args = {
    isSelected: true,
    path: new PathModel({
        path: '/NCIT/ST1000023/C7057/C3367/C36278/C36289/C35877/C35880/C35883/C157653/C157287/C162512/C167155/C136411/C142112/C136648/C36214/C140330/C150453/C138065/C163008/C154097/',
        code: 'NCIT:C154097',
        hasChildren: false,
        label: 'Blasts More than 60 Percent of Bone Marrow Nucleated Cells',
    }),
    title: 'Im a little title',
};
