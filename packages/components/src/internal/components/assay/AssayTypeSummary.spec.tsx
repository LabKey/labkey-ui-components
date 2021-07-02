import React from 'react';

import { mount } from 'enzyme';

import { AssayTypeSummary } from '../../..';
import { initUnitTestMocks } from '../../testHelperMocks';
import { selectOptionByText, SELECT_INPUT_CONTROL_SELECTOR } from '../forms/input/SelectInputTestUtils';

beforeAll(() => {
    initUnitTestMocks();
});

describe('<AssayTypeSummary />', () => {
    test('Assay Type Display', async () => {
        const component = mount(<AssayTypeSummary navigate={jest.fn()} />);

        expect(component.find(SELECT_INPUT_CONTROL_SELECTOR)).toHaveLength(1);
        expect(component.find('.heatmap-container')).toHaveLength(0);
        expect(component.find('.grid-panel')).toHaveLength(1);

        await selectOptionByText(component, 'Heatmap');

        expect(component.find(SELECT_INPUT_CONTROL_SELECTOR)).toHaveLength(1);
        expect(component.find('.heatmap-container')).toHaveLength(1);
        expect(component.find('.grid-panel')).toHaveLength(0);
    });
});
