import React from 'react';
import { mount } from 'enzyme';

import { SampleSetSummary } from '../../..';
import { initUnitTestMocks } from '../../testHelperMocks';
import { TEST_USER_APP_ADMIN } from '../../../test/data/users';
import { selectOptionByText, SELECT_INPUT_CONTROL_SELECTOR } from '../forms/input/SelectInputTestUtils';

beforeAll(() => {
    initUnitTestMocks();
});

describe('<SampleSetSummary />', () => {
    test('Summary display', async () => {
        const component = mount(<SampleSetSummary navigate={jest.fn()} user={TEST_USER_APP_ADMIN} />);

        expect(component.find('.heatmap-container')).toHaveLength(0);
        expect(component.find('.grid-panel')).toHaveLength(1);
        expect(component.find('.cards')).toHaveLength(0);
        expect(component.find(SELECT_INPUT_CONTROL_SELECTOR)).toHaveLength(1);

        await selectOptionByText(component, 'Heatmap');

        expect(component.find('.heatmap-container')).toHaveLength(1);
        expect(component.find('.grid-panel')).toHaveLength(0);
        expect(component.find('.cards')).toHaveLength(0);
        expect(component.find(SELECT_INPUT_CONTROL_SELECTOR)).toHaveLength(1);

        await selectOptionByText(component, 'Cards');

        expect(component.find('.heatmap-container')).toHaveLength(0);
        expect(component.find('.grid-panel')).toHaveLength(0);
        expect(component.find('.cards')).toHaveLength(2); // With and without samples
        expect(component.find(SELECT_INPUT_CONTROL_SELECTOR)).toHaveLength(1);
    });
});
