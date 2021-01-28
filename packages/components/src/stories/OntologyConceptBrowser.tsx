import React from 'react';
import { storiesOf } from '@storybook/react';
import {number, text, withKnobs} from '@storybook/addon-knobs';
import { OntologyTabs } from '..';
import {OntologyModel} from "../internal/components/ontology/models";


// const baseOntologyModel = {
//     name: 'WaffleCopters',
//     conceptCount: 6,
//     ontologyId: 7,
// } as OntologyModel;

storiesOf('OntologyTabsPanel', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        const baseOntologyModel = {
            name: text('Name', 'Banana pancakes', "OntologyModel"),
            conceptCount: number("count", 600, {},"OntologyModel"),
            ontologyId: number("Id", 3, {}, "OntologyModel")
        } as OntologyModel;

        return (
            <div>
                <OntologyTabs model={baseOntologyModel} />
            </div>
        );
    });
