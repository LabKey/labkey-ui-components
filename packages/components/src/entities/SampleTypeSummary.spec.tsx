import React from 'react';
import { mount } from 'enzyme';

import { initUnitTestMocks } from '../test/testHelperMocks';
import { TEST_USER_READER, TEST_USER_EDITOR } from '../internal/userFixtures';

import { GridPanelWithModel } from '../public/QueryModel/GridPanel';

import { SampleTypeSummary } from './SampleTypeSummary';

beforeAll(() => {
    initUnitTestMocks();
});

describe('<SampleTypeSummary />', () => {
    test('canUpdate true', async () => {
        const component = mount(<SampleTypeSummary navigate={jest.fn()} user={TEST_USER_EDITOR} />);

        expect(component.find(GridPanelWithModel)).toHaveLength(1);
        const config = component.find(GridPanelWithModel).prop('queryConfig');
        expect(config.requiredColumns).toStrictEqual(['lsid']);
        expect(config.omittedColumns).toStrictEqual([
            'ImportAliases',
            'MaterialInputImportAliases',
            'DataInputImportAliases',
        ]);
    });

    test('canUpdate false', async () => {
        const component = mount(<SampleTypeSummary navigate={jest.fn()} user={TEST_USER_READER} />);

        expect(component.find(GridPanelWithModel)).toHaveLength(1);
        const config = component.find(GridPanelWithModel).prop('queryConfig');
        expect(config.requiredColumns).toBe(undefined);
        expect(config.omittedColumns).toStrictEqual([
            'ImportAliases',
            'MaterialInputImportAliases',
            'DataInputImportAliases',
            'lsid',
        ]);
    });
});
