import React from 'react';
import renderer from 'react-test-renderer';

import { registerDefaultURLMappers, sleep } from '../../../test/testHelpers';
import { initUnitTestMocks } from '../../../../test/testHelperMocks';
import { initLineageMocks } from '../../../../test/mock';
import { initBrowserHistoryState } from '../../../util/global';

import { LineageGrid } from './LineageGrid';

beforeAll(() => {
    LABKEY.container = {
        id: 'testContainerEntityId',
        title: 'Test Container',
        path: '/testContainer',
    };

    initBrowserHistoryState();
    initUnitTestMocks([initLineageMocks]);
    registerDefaultURLMappers();
});

describe('<LineageGrid/>', () => {
    test('loading', () => {
        const component = renderer.create(
            <LineageGrid lsid="urn:lsid:labkey.com:Sample.9273.ExpressionSystemSamples:ES-1.2" />
        );

        expect(component).toMatchSnapshot();
    });

    test('with data', async () => {
        const component = renderer.create(
            <LineageGrid lsid="urn:lsid:labkey.com:Sample.9273.ExpressionSystemSamples:ES-1.2" />
        );

        await sleep();

        expect(component).toMatchSnapshot();
    });
});
