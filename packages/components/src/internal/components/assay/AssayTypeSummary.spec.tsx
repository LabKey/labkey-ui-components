import React from 'react';
import ReactSelect from 'react-select';

import { mount } from 'enzyme';

import { AssayTypeSummary } from '../../..';
import { waitForLifecycle } from '../../testHelpers';
import { initUnitTestMocks } from '../../testHelperMocks';

beforeAll(() => {
    initUnitTestMocks();
});

describe('<AssayTypeSummary />', () => {
    test('Assay Type Display', async () => {
        const component = mount(<AssayTypeSummary navigate={jest.fn()} />);

        expect(component.find('.Select-control')).toHaveLength(1);
        expect(component.find('.heatmap-container')).toHaveLength(0);
        expect(component.find('.grid-panel')).toHaveLength(1);

        (component.find(ReactSelect).instance() as any).selectValue({ value: 'heatmap' });
        await waitForLifecycle(component);

        expect(component.find('.Select-control')).toHaveLength(1);
        expect(component.find('.heatmap-container')).toHaveLength(1);
        expect(component.find('.grid-panel')).toHaveLength(0);
    });
});
