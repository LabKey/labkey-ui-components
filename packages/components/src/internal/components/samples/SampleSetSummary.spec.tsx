import React from 'react';
import ReactSelect from 'react-select';
import { mount } from 'enzyme';

import { SampleSetSummary, waitForLifecycle } from '../../..';
import { initUnitTestMocks } from '../../testHelperMocks';
import { TEST_USER_APP_ADMIN } from '../../../test/data/users';

beforeAll(() => {
    initUnitTestMocks();
});

describe('<SampleSetSummary />', () => {
    test('Summary display', async () => {
        const component = mount(<SampleSetSummary navigate={jest.fn()} user={TEST_USER_APP_ADMIN} />);

        expect(component.find('.Select-control')).toHaveLength(1);
        expect(component.find('.heatmap-container')).toHaveLength(0);
        expect(component.find('.grid-panel')).toHaveLength(1);
        expect(component.find('.cards')).toHaveLength(0);

        (component.find(ReactSelect).instance() as any).selectValue({ value: 'heatmap' });
        await waitForLifecycle(component);

        expect(component.find('.Select-control')).toHaveLength(1);
        expect(component.find('.heatmap-container')).toHaveLength(1);
        expect(component.find('.grid-panel')).toHaveLength(0);
        expect(component.find('.cards')).toHaveLength(0);

        (component.find(ReactSelect).instance() as any).selectValue({ value: 'cards' });
        await waitForLifecycle(component);

        expect(component.find('.Select-control')).toHaveLength(1);
        expect(component.find('.heatmap-container')).toHaveLength(0);
        expect(component.find('.grid-panel')).toHaveLength(0);
        expect(component.find('.cards')).toHaveLength(2); // With and without samples
    });
});
