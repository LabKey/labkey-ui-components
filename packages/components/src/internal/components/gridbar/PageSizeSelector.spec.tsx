import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';
import { List } from 'immutable';

import { QueryGridModel } from '../base/models/model';

import { PageSizeSelector } from './PageSizeSelector';

describe('<PageSizeSelector/>', () => {
    test('default props', () => {
        const model = new QueryGridModel({
            maxRows: 20,
            totalRows: 100,
        });
        const component = <PageSizeSelector model={model} />;

        const tree = renderer.create(component);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('maxRows not first options', () => {
        const model = new QueryGridModel({
            maxRows: 40,
            totalRows: 100,
        });
        const component = <PageSizeSelector model={model} />;

        const tree = renderer.create(component);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('maxRows not in options', () => {
        const model = new QueryGridModel({
            maxRows: 5,
            totalRows: 100,
        });
        const component = <PageSizeSelector model={model} />;

        const tree = renderer.create(component);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('custom options', () => {
        const model = new QueryGridModel({
            maxRows: 1,
            totalRows: 100,
        });
        const component = <PageSizeSelector model={model} options={List.of(1, 2, 3)} />;

        const tree = renderer.create(component);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('empty options', () => {
        const model = new QueryGridModel({
            maxRows: 1,
            totalRows: 100,
        });
        const component = <PageSizeSelector model={model} options={List<number>()} />;

        const tree = renderer.create(component);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('hidden based on totalRows', () => {
        const model = new QueryGridModel({
            maxRows: 20,
            totalRows: 20,
        });
        const component = <PageSizeSelector model={model} />;

        const tree = renderer.create(component);
        expect(tree.toJSON()).toMatchSnapshot();
    });
});
