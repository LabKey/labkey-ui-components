import React from 'react';

import { mountWithAppServerContext } from '../../test/enzymeTestHelpers';
import { TEST_USER_READER, TEST_USER_AUTHOR } from '../../userFixtures';

import { SampleButtons } from './BarChartViewer';

describe('SampleButtons', () => {
    test('with insert and sample finder enabled', () => {
        const wrapper = mountWithAppServerContext(<SampleButtons />, undefined, { user: TEST_USER_AUTHOR });
        expect(wrapper.find('a').first().text()).toBe('Go to Sample Finder');
        expect(wrapper.find('button').last().text()).toBe('Add Samples');
        wrapper.unmount();
    });

    test('without insert and sample finder enabled', () => {
        const wrapper = mountWithAppServerContext(<SampleButtons />, undefined, { user: TEST_USER_READER });
        expect(wrapper.find('a').first().text()).toBe('Go to Sample Finder');
        wrapper.unmount();
    });
});
