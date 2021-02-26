import React from 'react';

import { mount } from 'enzyme';

import { Location, SampleSetSummary, User, waitForLifecycle } from '../../..';
import { registerDefaultURLMappers } from '../../testHelpers';
import { initUnitTestMocks } from '../../testHelperMocks';

beforeAll(() => {
    initUnitTestMocks();
    registerDefaultURLMappers();
});

describe('<SampleSetSummary />', () => {
    test('Summary display', async () => {
        const location: Location = {
            query: {
                viewAs: 'grid',
            },
        };

        const user = new User({
            avatar: undefined,
            displayName: 'Test User',
            isSignedIn: true,
            isAdmin: true,
        });

        const component = mount(<SampleSetSummary location={location} navigate={() => {}} user={user} />);

        let grid = component.find('.grid-panel');
        expect(grid).toHaveLength(1);

        let cards = component.find('.cards');
        expect(cards).toHaveLength(0);

        const selector = component.find('.Select-control');
        expect(selector).toHaveLength(1);

        let arrow = component.find('.Select-arrow-zone');
        expect(arrow).toHaveLength(1);

        // Select view in drop down using key presses
        arrow.simulate('keyDown', { keyCode: 40 }); // down key
        arrow.simulate('keyDown', { keyCode: 40 });
        arrow.simulate('keyDown', { keyCode: 13 }); // enter
        await waitForLifecycle(component);

        const heatmap = component.find('.heatmap-container');
        expect(heatmap).toHaveLength(1);

        grid = component.find('.grid-panel');
        expect(grid).toHaveLength(0);

        arrow = component.find('.Select-arrow-zone');
        arrow.simulate('keyDown', { keyCode: 40 });
        arrow.simulate('keyDown', { keyCode: 40 });
        arrow.simulate('keyDown', { keyCode: 13 });
        await waitForLifecycle(component);

        cards = component.find('.cards');
        expect(cards).toHaveLength(2); // With and without samples
    });
});
