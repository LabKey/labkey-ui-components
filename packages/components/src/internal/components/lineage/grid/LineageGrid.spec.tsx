import React from 'react';
import renderer from 'react-test-renderer';

import { makeTestISelectRowsResult, registerDefaultURLMappers, sleep } from '../../../test/testHelpers';
import runsQuery from '../../../../test/data/exp-runs-getQuery.json';
import runsQueryInfo from '../../../../test/data/exp-runs-getQueryDetails.json';
import lineageSampleData from '../../../../test/data/experiment-lineage.json';
import hemoglobinLineageQueryIn from '../../../../test/data/samples-hemoglobin-getQuery-in.json';
import hemoglobinLineageQueryInfo from '../../../../test/data/samples-hemoglobin-getQueryDetails.json';
import { TestLineageAPIWrapper } from '../actions';
import { LineageResult } from '../models';

import { LineageGrid } from './LineageGrid';

let API;

beforeAll(() => {
    LABKEY.container = {
        id: 'testContainerEntityId',
        title: 'Test Container',
        path: '/testContainer',
    };
    registerDefaultURLMappers();
    const result = LineageResult.create(lineageSampleData);
    const hemoGlobinData = makeTestISelectRowsResult(hemoglobinLineageQueryIn, hemoglobinLineageQueryInfo);
    const expRunsData = makeTestISelectRowsResult(runsQuery, runsQueryInfo);
    API = new TestLineageAPIWrapper(result, [hemoGlobinData, expRunsData]);
});

describe('<LineageGrid/>', () => {
    test('loading', () => {
        const component = renderer.create(
            <LineageGrid lsid="urn:lsid:labkey.com:Sample.9273.ExpressionSystemSamples:ES-1.2" api={API} />
        );

        expect(component).toMatchSnapshot();
    });

    test('with data', async () => {
        const component = renderer.create(
            <LineageGrid lsid="urn:lsid:labkey.com:Sample.9273.ExpressionSystemSamples:ES-1.2" api={API} />
        );

        await sleep();

        expect(component).toMatchSnapshot();
    });
});
