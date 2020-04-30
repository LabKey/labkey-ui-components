import React from 'react';
import renderer from 'react-test-renderer';

import { SplitButtonGroup } from './SplitButtonGroup';

describe('<SplitButtonGroup/>', () => {
    test('both buttons enabled', () => {
        const onClickFn = jest.fn();
        const component = <SplitButtonGroup defaultBtnLabel="click me" onClickDefaultBtn={onClickFn} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('main button enabled, dropdown disabled', () => {
        const onClickFn = jest.fn();
        const component = (
            <SplitButtonGroup defaultBtnLabel="click me" onClickDefaultBtn={onClickFn} dropdownBtnDisabled={true} />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('main button disabled, dropdown enabled', () => {
        const onClickFn = jest.fn();
        const component = (
            <SplitButtonGroup defaultBtnLabel="click me" onClickDefaultBtn={onClickFn} defaultBtnDisabled={true} />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
