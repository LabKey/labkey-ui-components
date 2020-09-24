import React from 'react';
import { fromJS } from 'immutable';
import renderer from 'react-test-renderer';

import { LabelColorRenderer } from '../..';

describe('LabelColorRenderer', () => {
    test('undefined data', () => {
        const component = <LabelColorRenderer data={undefined} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('empty data', () => {
        const component = <LabelColorRenderer data={fromJS({})} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with data', () => {
        const component = <LabelColorRenderer data={fromJS({ value: '#000000' })} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
