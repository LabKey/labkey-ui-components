import React from 'react';
import { storiesOf } from '@storybook/react';
import { array, number, text, withKnobs } from '@storybook/addon-knobs';

import { OntologyTabs } from '../internal/components/ontology/OntologyTabs';
import { ConceptModel, OntologyModel, PathModel } from '../internal/components/ontology/models';

// TODO remove as component likely will never be used on it's own
const mockRoot = new PathModel({
    path: '/NCIT/',
    code: '/NCIT/',
    label: 'Ontologies',
    hasChildren: true,
    children: [],
});

const setSelectedMock = (conceptCode: string): void => {
    console.log(conceptCode);
};

const loadConceptsMock = (concepts: ConceptModel[]): void => {
    console.log(concepts);
};

//TODO use the Storybook 6 format
storiesOf('OntologyTabsPanel', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        const baseOntologyModel = new OntologyModel({
            name: text('Name', mockRoot.label, 'OntologyModel'),
            conceptCount: number('count', mockRoot.children.length, {}, 'OntologyModel'),
            description: text('Description', 'mockRoot.description', 'OntologyModel'),
            rowId: number('RowId', 42, {}, 'OntologyModel'),
            abbreviation: text('Abbreviation', mockRoot.code, 'OntologyModel'),
            path: text('Path', mockRoot.path, 'OntologyModel'),
        });
        const root = baseOntologyModel.getPathModel();

        return (
            <div>
                <OntologyTabs root={root} setSelectedConcept={setSelectedMock} loadConcepts={loadConceptsMock} />
            </div>
        );
    });
