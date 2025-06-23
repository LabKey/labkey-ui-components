import React from 'react';
import { render } from '@testing-library/react';
import { Filter } from '@labkey/api';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { IS_ALIQUOT_COL } from '../samples/constants';

import { GridAliquotViewSelector } from './GridAliquotViewSelector';

describe('<GridAliquotViewSelector/>', () => {
    beforeEach(() => {
        LABKEY.moduleContext = { samplemanagement: { 'experimental-sample-aliquot-selector': true } };
    });

    test('no queryModel', () => {
        render(<GridAliquotViewSelector />);
        expect(document.querySelector('.aliquot-view-selector')).not.toBeInTheDocument();
    });

    test('experimental flag disabled', () => {
        LABKEY.moduleContext = { samplemanagement: { 'experimental-sample-aliquot-selector': false } };
        const model = makeTestQueryModel(new SchemaQuery('a', 'b'));
        render(<GridAliquotViewSelector queryModel={model} />);
        expect(document.querySelector('.aliquot-view-selector')).not.toBeInTheDocument();
    });

    // Note: this method is identical to the one for SampleAliquotViewSelector, so it feels like we're mostly just
    // testing that component again. Is there something more specific to GridAliquotViewSelector that we should be
    // testing?
    function verifyOptions(all?: boolean, samples?: boolean, aliquots?: boolean) {
        const items = document.querySelectorAll('.lk-menu-item');
        const buttonText = document.querySelector('.dropdown-toggle').textContent;
        expect(items).toHaveLength(3);
        expect(document.querySelector('.dropdown-header')).toHaveTextContent('Show Samples');
        expect(items[0]).toHaveTextContent('Samples and Aliquots');
        expect(items[1]).toHaveTextContent('Samples Only');
        expect(items[2]).toHaveTextContent('Aliquots Only');

        if (all) {
            expect(items[0].getAttribute('class')).toContain('active');
            expect(buttonText).toEqual('All Samples');
        } else {
            expect(items[0].getAttribute('class')).not.toContain('active');
        }

        if (samples) {
            expect(items[1].getAttribute('class')).toContain('active');
            expect(buttonText).toEqual('Samples Only');
        } else {
            expect(items[1].getAttribute('class')).not.toContain('active');
        }

        if (aliquots) {
            expect(items[2].getAttribute('class')).toContain('active');
            expect(buttonText).toEqual('Aliquots Only');
        } else {
            expect(items[2].getAttribute('class')).not.toContain('active');
        }
    }

    test('with queryModel, without filter', () => {
        const model = makeTestQueryModel(new SchemaQuery('a', 'b'));
        render(<GridAliquotViewSelector queryModel={model} />);
        verifyOptions(true);
    });

    test('with queryModel, filtered to aliquots only', () => {
        let model = makeTestQueryModel(new SchemaQuery('a', 'b'));
        model = model.mutate({
            filterArray: [Filter.create(IS_ALIQUOT_COL, true)],
        });
        render(<GridAliquotViewSelector queryModel={model} />);

        verifyOptions(false, false, true);
    });

    test('with queryModel, filtered to samples only', () => {
        let model = makeTestQueryModel(new SchemaQuery('a', 'b'));
        model = model.mutate({
            filterArray: [Filter.create(IS_ALIQUOT_COL, false)],
        });
        render(<GridAliquotViewSelector queryModel={model} />);

        verifyOptions(false, true);
    });
});
