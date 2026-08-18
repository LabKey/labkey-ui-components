/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { Map } from 'immutable';

import { ItemsLegend } from './ItemsLegend';

describe('ItemsLegend', () => {
    test('empty box', () => {
        render(
            <ItemsLegend
                legendData={[
                    {
                        circleColor: 'none',
                        backgroundColor: 'FFFFFF',
                        borderColor: 'blue',
                        legendLabel: 'Empty location',
                    },
                ]}
            />
        );

        expect(document.querySelector('.box-viewer-legend')).toBeInTheDocument();
        expect(document.getElementsByClassName('cell-legend-row')).toHaveLength(1);
        expect(document.getElementsByClassName('cell-legend-icon')).toHaveLength(1);
        expect(document.getElementsByClassName('cell-legend-icon-border')).toHaveLength(1);
        expect(document.getElementsByClassName('cell-legend-circle')).toHaveLength(0);
        expect(document.getElementsByClassName('cell-legend-label')).toHaveLength(1);
        expect(document.getElementsByClassName('cell-legend-label')[0]).toHaveTextContent('Empty location');
    });

    test('multiple sample types and checked out status, no selection', () => {
        const MULTIPLE_SAMPLE_TYPES = [
            { circleColor: '#fe9200', backgroundColor: 'none', legendLabel: 'blood' },
            {
                circleColor: '#009ce0',
                backgroundColor: 'none',
                legendLabel: 'samp18',
            },
            { circleColor: '#2980b9', backgroundColor: 'none', legendLabel: 'sampleB' },
            {
                circleColor: 'none',
                backgroundColor: '#F5D4D3',
                legendLabel: 'Checked out/Reserved',
            },
            { circleColor: 'none', backgroundColor: 'FFFFFF', legendLabel: 'Empty location' },
        ];

        render(<ItemsLegend legendData={MULTIPLE_SAMPLE_TYPES} />);

        expect(document.querySelector('.box-viewer-legend')).toBeInTheDocument();
        expect(document.getElementsByClassName('cell-legend-row')).toHaveLength(5);
        expect(document.getElementsByClassName('cell-legend-icon')).toHaveLength(5);
        expect(document.getElementsByClassName('cell-legend-icon-border')).toHaveLength(2);
        expect(document.getElementsByClassName('cell-legend-circle')).toHaveLength(3);
        expect(document.getElementsByClassName('cell-legend-label')).toHaveLength(5);
        expect(document.getElementsByClassName('cell-legend-label')[0]).toHaveTextContent('blood');
        expect(document.getElementsByClassName('cell-legend-label')[1]).toHaveTextContent('samp18');
        expect(document.getElementsByClassName('cell-legend-label')[2]).toHaveTextContent('sampleB');
        expect(document.getElementsByClassName('cell-legend-label')[3]).toHaveTextContent('Checked out/Reserved');
        expect(document.getElementsByClassName('cell-legend-label')[4]).toHaveTextContent('Empty location');
    });

    test('multiple sample types with same color label', () => {
        const WITH_SAME_COLOR_LABELS = [
            { circleColor: '#fe9200', backgroundColor: 'none', legendLabel: 'blood' },
            {
                circleColor: '#009ce0',
                backgroundColor: 'none',
                legendLabel: 'samp18',
            },
            { circleColor: '#2980b9', backgroundColor: 'none', legendLabel: 'sampleB, sampleC' },
            {
                circleColor: 'none',
                backgroundColor: '#F5D4D3',
                legendLabel: 'Checked out/Reserved',
            },
            { circleColor: 'none', backgroundColor: 'FFFFFF', legendLabel: 'Empty location' },
        ];

        render(<ItemsLegend legendData={WITH_SAME_COLOR_LABELS} />);

        expect(document.querySelector('.box-viewer-legend')).toBeInTheDocument();
        expect(document.getElementsByClassName('cell-legend-row')).toHaveLength(5);
        expect(document.getElementsByClassName('cell-legend-icon')).toHaveLength(5);
        expect(document.getElementsByClassName('cell-legend-icon-border')).toHaveLength(2);
        expect(document.getElementsByClassName('cell-legend-circle')).toHaveLength(3);
        expect(document.getElementsByClassName('cell-legend-label')).toHaveLength(5);
        expect(document.getElementsByClassName('cell-legend-label')[2]).toHaveTextContent('sampleB, sampleC');
    });

    test('with selection, locked and expired', () => {
        const WITH_MIXED = [
            {
                circleColor: '#fe9200',
                backgroundColor: 'none',
                legendLabel: 'blood',
            },
            { circleColor: '#009ce0', backgroundColor: 'none', legendLabel: 'samp18' },
            {
                circleColor: '#fe9200',
                backgroundColor: '#EDF3FF',
                legendLabel: 'blood selected',
            },
            {
                circleColor: '#009ce0',
                backgroundColor: '#EDF3FF',
                legendLabel: 'samp18 selected',
            },
            {
                circleColor: '#2980b9',
                backgroundColor: '#EDF3FF',
                legendLabel: 'sampleB selected, sampleC selected',
            },
            { circleColor: 'none', backgroundColor: '#EDF3FF', legendLabel: 'Empty selected' },
            {
                circleColor: 'none',
                backgroundColor: '#F5D4D3',
                legendLabel: 'Checked out/Reserved',
            },
            {
                circleColor: 'none',
                backgroundColor: 'none',
                legendLabel: 'Restricted',
                locked: true,
            },
            {
                circleColor: '#009ce0',
                backgroundColor: 'none',
                legendLabel: 'Sample expired',
                expired: true,
            },
            { circleColor: 'none', backgroundColor: 'FFFFFF', legendLabel: 'Empty location' },
        ];

        render(<ItemsLegend legendData={WITH_MIXED} />);

        expect(document.querySelector('.box-viewer-legend')).toBeInTheDocument();
        expect(document.getElementsByClassName('cell-legend-row')).toHaveLength(10);
        expect(document.getElementsByClassName('cell-legend-icon')).toHaveLength(10);
        expect(document.getElementsByClassName('cell-legend-icon-border')).toHaveLength(6);
        expect(document.getElementsByClassName('cell-legend-circle')).toHaveLength(6);
        expect(document.getElementsByClassName('cell-legend-label')).toHaveLength(10);
        expect(document.getElementsByClassName('cell-legend-label')[7]).toHaveTextContent('Restricted');
        expect(document.getElementsByClassName('cell-legend-icon-margin')).toHaveLength(1);
        expect(document.getElementsByClassName('cell-lock')).toHaveLength(1);
        expect(document.getElementsByClassName('cell-legend-label')[8]).toHaveTextContent('Sample expired');
        expect(document.getElementsByClassName('expired-form-field')).toHaveLength(1);
    });

    test('with link and activeIndex', () => {
        const sampleAllocationLegends = [
            {
                circleColor: '#ab149e',
                backgroundColor: 'none',
                legendLabel: 'Cell Bank',
                data: Map.of(
                    'value',
                    2,
                    'url',
                    '/LKSM/freezermanager-app.view#/boxes/9?query.SampleType/Name~eq=Cell Bank'
                ),
            },
            {
                circleColor: '#2980b9',
                backgroundColor: 'none',
                legendLabel: 'CellValidation',
                data: Map.of(
                    'value',
                    1,
                    'url',
                    '/LKSM/freezermanager-app.view#/boxes/9?query.SampleType/Name~eq=CellValidation'
                ),
            },
            {
                circleColor: 'fff',
                backgroundColor: 'none',
                legendLabel: 'Space Available',
                data: Map.of('value', 1),
            },
        ];
        render(<ItemsLegend legendData={sampleAllocationLegends} activeIndex={1} />);
        const legends = document.querySelectorAll('tr');
        expect(legends).toHaveLength(3);
        expect(document.querySelectorAll('a')).toHaveLength(2);
        expect(legends[0].querySelectorAll('a')).toHaveLength(1);
        expect(legends[0].querySelectorAll('.bold-text')).toHaveLength(0);
        expect(legends[1].querySelectorAll('a')).toHaveLength(1);
        expect(legends[1].querySelectorAll('.bold-text')).toHaveLength(1);
        expect(legends[2].querySelectorAll('a')).toHaveLength(0);
    });

    test('section headers', () => {
        render(
            <ItemsLegend
                activeIndex={2}
                legendData={[
                    {
                        circleColor: 'none',
                        backgroundColor: 'none',
                        legendLabel: 'Blood',
                        isSectionHeader: true,
                        data: Map.of('value', 20),
                    },
                    { circleColor: '#ff0000', backgroundColor: 'none', legendLabel: 'Red', data: Map.of('value', 12) },
                    { circleColor: '#0000ff', backgroundColor: 'none', legendLabel: 'Blue', data: Map.of('value', 8) },
                    {
                        circleColor: 'green',
                        backgroundColor: 'none',
                        legendLabel: 'Plasma',
                        separatorAbove: true,
                        data: Map.of('value', 22),
                    },
                ]}
            />
        );

        const rows = document.querySelectorAll('tr');
        expect(rows).toHaveLength(4);

        // the header carries the section total but no color swatch, and is not bolded
        expect(document.getElementsByClassName('cell-legend-section')).toHaveLength(1);
        expect(rows[0]).toHaveTextContent('Blood');
        expect(rows[0]).toHaveTextContent('20');
        expect(rows[0].querySelectorAll('.cell-legend-icon')).toHaveLength(0);
        expect(rows[0].querySelectorAll('.cell-legend-section-label')).toHaveLength(2);
        expect(rows[0].getAttribute('class')).not.toContain('cell-legend-row--separator');

        expect(rows[1].querySelectorAll('.cell-legend-circle')).toHaveLength(1);
        expect(rows[1].querySelectorAll('.bold-text')).toHaveLength(0);
        expect(rows[2].querySelectorAll('.bold-text')).toHaveLength(1); // activeIndex
        expect(rows[3]).toHaveTextContent('Plasma');

        // the rule closing off the Blood section sits on the row that follows it
        expect(document.getElementsByClassName('cell-legend-row--separator')).toHaveLength(1);
        expect(rows[3].getAttribute('class')).toContain('cell-legend-row--separator');
    });
});
