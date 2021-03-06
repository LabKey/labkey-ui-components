import React from 'react';
import ReactSelect from 'react-select';
import { mount, ReactWrapper } from 'enzyme';

import { SelectView, SelectViewInput } from '../../..';
import { waitForLifecycle } from '../../testHelpers';

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

function setSelectValue(wrapper: ReactWrapper, value: any): void {
    (wrapper.find(ReactSelect).instance() as any).selectValue({ value });
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
        setSelectValue(wrapper, expectedValue);
        await waitForLifecycle(wrapper);

        // Assert
        expect(props.onViewSelect).toHaveBeenCalledTimes(1);
        expect(getSelectValue(wrapper)).toEqual(expectedValue);
        expect(getSelectViewsInLocalStorage()[props.id]).toEqual(expectedValue);
    });

    test('supports custom options', async () => {
        // Arrange
        const originalValue = 'mariners';
        const newValue = 'twins';

        const views = [
            { label: 'Seattle Mariners', value: 'mariners' },
            { label: 'Minnesota Twins', value: 'twins' },
            SelectView.Heatmap,
        ];
        const props = getDefaultProps();

        // Act
        const wrapper = mount(<SelectViewInput {...props} defaultView={originalValue} views={views} />);

        // Assert
        expect(getSelectValue(wrapper)).toEqual(originalValue);

        // Act - change value
        setSelectValue(wrapper, newValue);
        await waitForLifecycle(wrapper);

        expect(getSelectValue(wrapper)).toEqual(newValue);
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
