import React from 'react';
import renderer from 'react-test-renderer';

import { initUnitTestMocks, registerDefaultURLMappers, sleep } from '../../../testHelpers';

import { LineageGrid } from './LineageGrid';

beforeAll(() => {
    initUnitTestMocks();
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
