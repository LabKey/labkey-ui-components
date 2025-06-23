import React from 'react';
import { render } from '@testing-library/react';

import { ALIQUOT_FILTER_MODE } from '../samples/constants';

import { SampleAliquotViewSelector } from './SampleAliquotViewSelector';

describe('<SampleAliquotViewSelector/>', () => {
    function verifyOptions(all?: boolean, samples?: boolean, aliquots?: boolean) {
        const buttonText = document.querySelector('.dropdown-toggle').textContent;
        const items = document.querySelectorAll('.lk-menu-item');
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

    test('aliquotFilterMode undefined', () => {
        render(
            <SampleAliquotViewSelector aliquotFilterMode={ALIQUOT_FILTER_MODE.all} updateAliquotFilter={jest.fn()} />
        );

        verifyOptions(true);
    });

    test('aliquotFilterMode: all', () => {
        render(
            <SampleAliquotViewSelector aliquotFilterMode={ALIQUOT_FILTER_MODE.all} updateAliquotFilter={jest.fn()} />
        );

        verifyOptions(true);
    });

    test('aliquotFilterMode: samples', () => {
        render(
            <SampleAliquotViewSelector
                aliquotFilterMode={ALIQUOT_FILTER_MODE.samples}
                updateAliquotFilter={jest.fn()}
            />
        );

        verifyOptions(false, true);
    });

    test('aliquotFilterMode: aliquots', () => {
        render(
            <SampleAliquotViewSelector
                aliquotFilterMode={ALIQUOT_FILTER_MODE.aliquots}
                updateAliquotFilter={jest.fn()}
            />
        );
        verifyOptions(false, false, true);
    });

    test('customized labels', () => {
        render(
            <SampleAliquotViewSelector
                aliquotFilterMode={ALIQUOT_FILTER_MODE.all}
                allLabel="Parent Sample and Aliquots"
                headerLabel="Show Jobs with Samples"
                samplesLabel="Parent Sample Only"
                updateAliquotFilter={jest.fn()}
            />
        );

        expect(document.querySelector('.dropdown-header')).toHaveTextContent('Show Jobs with Samples');

        const items = document.querySelectorAll('.lk-menu-item');
        expect(items).toHaveLength(3);
        expect(items[0]).toHaveTextContent('Parent Sample and Aliquots');
        expect(items[1]).toHaveTextContent('Parent Sample Only');
        expect(items[2]).toHaveTextContent('Aliquots Only');
    });
});
