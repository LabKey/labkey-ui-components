import React from 'react';
import renderer from 'react-test-renderer';

import { ItemsLegend } from './ItemsLegend';

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
        expired: true
    },
    { circleColor: 'none', backgroundColor: 'FFFFFF', legendLabel: 'Empty location' },
];

describe('<ItemsLegend/>', () => {
    test('empty box', () => {
        const component = (
            <ItemsLegend
                legendData={[{ circleColor: 'none', backgroundColor: 'FFFFFF', legendLabel: 'Empty location' }]}
            />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('multiple sample types and checked out status, no selection', () => {
        const component = <ItemsLegend legendData={MULTIPLE_SAMPLE_TYPES} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('multiple sample types with same color label', () => {
        const component = <ItemsLegend legendData={WITH_SAME_COLOR_LABELS} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with selection, locked and expired', () => {
        const component = <ItemsLegend legendData={WITH_MIXED} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

});
