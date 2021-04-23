import React from 'react';

import { mount } from 'enzyme';

import { SampleSetSummary, waitForLifecycle } from '../../..';
import { initUnitTestMocks } from '../../testHelperMocks';
import { TEST_USER_APP_ADMIN } from '../../../test/data/users';

beforeAll(() => {
    initUnitTestMocks();
});

describe('<SampleSetSummary />', () => {
    test('Summary display', async () => {
        const component = mount(
            <SampleSetSummary location={{ query: { viewAs: 'grid' } }} navigate={() => {}} user={TEST_USER_APP_ADMIN} />
        );

        expect(component.find('.Select-control')).toHaveLength(1);
        expect(component.find('.heatmap-container')).toHaveLength(0);
        expect(component.find('.grid-panel')).toHaveLength(1);
        expect(component.find('.cards')).toHaveLength(0);

        component.setProps({ location: { query: { viewAs: 'heatmap' } } });
        await waitForLifecycle(component);

        expect(component.find('.Select-control')).toHaveLength(1);
        expect(component.find('.heatmap-container')).toHaveLength(1);
        expect(component.find('.grid-panel')).toHaveLength(0);
        expect(component.find('.cards')).toHaveLength(0);

        component.setProps({ location: { query: { viewAs: 'cards' } } });
        await waitForLifecycle(component);

        expect(component.find('.Select-control')).toHaveLength(1);
        expect(component.find('.heatmap-container')).toHaveLength(0);
        expect(component.find('.grid-panel')).toHaveLength(0);
        expect(component.find('.cards')).toHaveLength(2); // With and without samples
    });
});
