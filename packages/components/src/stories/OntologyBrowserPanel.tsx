import React from 'react';
import { storiesOf } from '@storybook/react';
import {number, text, withKnobs} from '@storybook/addon-knobs';
import { OntologyBrowserPanel } from '..';
import {OntologyModel} from "../internal/components/ontology/models";

storiesOf('OntologyBrowserPanel', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        const baseOntologyModel = {
            name: text('Name', 'Banana pancakes', "OntologyModel"),
            conceptCount: number("count", 600, {},"OntologyModel"),
            ontologyId: number("Id", 3, {}, "OntologyModel")
        } as OntologyModel;

        return ( <OntologyBrowserPanel ontologyId={ 7 } /> );
    });
