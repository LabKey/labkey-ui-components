import React from 'react';
import { storiesOf } from '@storybook/react';
import {number, text, withKnobs} from '@storybook/addon-knobs';
import { OntologyBrowserPanel } from '..';
import { OntologyModel, PathModel } from "../internal/components/ontology/models";
import { OntologyBrowserPanelImpl } from '../internal/components/ontology/OntologyBrowserPanel';

const mockRoot = new PathModel({
    path: '/NCIT/',
    code: 'NCIT',
    label: 'Ontologies',
    hasChildren: true,
    children: [],
});

const setSelectedMock = (conceptCode: string): void => {
    console.log(conceptCode);
};

//TODO use the Storybook 6 format
storiesOf('OntologyBrowserPanel', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        const baseOntologyModel = new OntologyModel({
            name: text('Name', mockRoot.label, 'OntologyModel'),
            conceptCount: number('count', mockRoot.children.length, {}, 'OntologyModel'),
            abbreviation: text('Abbreviation', mockRoot.code, 'OntologyModel'),
            description: text('description', 'Some long description', 'OntologyModel'),
            rowId: number('RowId', 42, {}, 'OntologyModel'),
            path: text('Path', mockRoot.path, 'OntologyModel'),
        });

        return ( <OntologyBrowserPanelImpl ontology={ baseOntologyModel} setSelectedConcept={setSelectedMock}  /> );
    });
