import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { SelectView, SelectViewInput } from '../../..';
import { selectOptionByText } from '../forms/input/SelectInputTestUtils';

import {
    clearSelectViewsInLocalStorage,
    getSelectViewsInLocalStorage,
    setSelectViewInLocalStorage,
} from './SelectViewInput';

function getDefaultProps() {
    return {
        defaultView: SelectView.Grid,
        id: 'test-select-view-input',
        onViewSelect: jest.fn(),
        views: [SelectView.Cards, SelectView.Grid, SelectView.Heatmap],
    };
}

function getSelectValue(wrapper: ReactWrapper): any {
    return wrapper.find('input[name="select-view-input"]').prop('value');
}

describe('SelectViewInput', () => {
    beforeEach(() => {
        clearSelectViewsInLocalStorage();
    });

    test('default', async () => {
        // Arrange
        const expectedValue = SelectView.Heatmap;
        const props = getDefaultProps();

        // Act
        const wrapper = mount(<SelectViewInput {...props} />);

        // Assert
        expect(getSelectValue(wrapper)).toEqual(props.defaultView);
        expect(getSelectViewsInLocalStorage()[props.id]).toBeUndefined();

        // Act - change value
        await selectOptionByText(wrapper, 'Heatmap');

        // Assert
        expect(props.onViewSelect).toHaveBeenCalledTimes(1);
        expect(getSelectValue(wrapper)).toEqual(expectedValue);
        expect(getSelectViewsInLocalStorage()[props.id]).toEqual(expectedValue);
    });

    test('supports custom options', async () => {
        // Arrange
        const option1 = { label: 'Seattle Mariners', value: 'mariners' };
        const option2 = { label: 'Minnesota Twins', value: 'twins' };
        const views = [option1, option2, SelectView.Heatmap];
        const props = getDefaultProps();

        // Act
        const wrapper = mount(<SelectViewInput {...props} defaultView={option1.value} views={views} />);

        // Assert
        expect(getSelectValue(wrapper)).toEqual(option1.value);

        // Act - change value
        await selectOptionByText(wrapper, option2.label);

        expect(getSelectValue(wrapper)).toEqual(option2.value);
    });

    test('localStorage -- pre-existing value', () => {
        // Arrange
        const props = getDefaultProps();
        setSelectViewInLocalStorage(props.id, SelectView.Cards);

        // Act
        const wrapper = mount(<SelectViewInput {...props} defaultView={SelectView.Grid} />);

        // Assert
        expect(getSelectValue(wrapper)).toEqual(SelectView.Cards);
    });
});
