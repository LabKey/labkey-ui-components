import React from 'react';
import { fromJS } from 'immutable';
import renderer from 'react-test-renderer';

import { DefaultRenderer } from '../..';

describe('DefaultRenderer', () => {
    test('undefined', () => {
        const component = <DefaultRenderer data={undefined} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('string', () => {
        const component = <DefaultRenderer data="test string" />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('boolean', () => {
        const component = <DefaultRenderer data={true} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    // TODO MultiValueRenderer
    // test('list', () => {
    //     const component = <DefaultRenderer data={List.of(...)} />;
    //     const tree = renderer.create(component).toJSON();
    //     expect(tree).toMatchSnapshot();
    // });

    test('value', () => {
        const component = <DefaultRenderer data={fromJS({ value: 1 })} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('displayValue', () => {
        const component = <DefaultRenderer data={fromJS({ value: 1, displayValue: 'Value 1' })} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('formattedValue', () => {
        const component = (
            <DefaultRenderer data={fromJS({ value: 1, displayValue: 'Value 1', formattedValue: 'Value 1.00' })} />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('url', () => {
        const component = <DefaultRenderer data={fromJS({ value: 1, displayValue: 'Value 1', url: 'labkey.com' })} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('new line', () => {
        const component = <DefaultRenderer data={'test1\ntest2'} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
