import { fromJS } from 'immutable';

import entitiesJSON from '../../test/data/sampleSetSearchResult.json';
import lineageJSON from '../../test/data/experiment-lineage.json';
import { LineageResult } from '../components/lineage/models';

import { registerDefaultURLMappers } from '../testHelpers';

import { parsePathName, URLResolver } from './URLResolver';

beforeAll(() => {
    registerDefaultURLMappers();
});

describe('resolveSearchUsingIndex', () => {
    test('resolve Sample Set url', () => {
        const resolver = new URLResolver();

        const testJson = fromJS(entitiesJSON);
        return resolver.resolveSearchUsingIndex(testJson).then(resolved => {
            expect(resolved).toHaveProperty(['hits']);
            expect(resolved).toHaveProperty(['hits', 0]);
            expect(resolved).toHaveProperty(['hits', 0, 'url'], '#/samples/Molecule');
            expect(resolved).toHaveProperty(['hits', 0, 'data', 'name'], 'Molecule'); // not sure if this is best place to check this...
        });
    });
});

describe('resolveLineage', () => {
    const resolver = new URLResolver();

    test('name with spaces', () => {
        const lineageResult = LineageResult.create({
            seed: 'urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4',
            nodes: {
                'urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4': {
                    lsid: 'urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4',
                    children: [
                        {
                            lsid: 'urn:lsid:labkey.com:Run.Folder-252:a6e5fa05-28cd-1038-ad87-68bd1b9ac33e',
                            role: 'no role',
                        },
                    ],
                    name: 'D-32',
                    cpasType: 'urn:lsid:labkey.com:DataClass.Folder-252:Source+1',
                    queryName: 'Source 1',
                    type: 'Data',
                    schemaName: 'exp.data',
                    url: '/labkey/Sam%20Man/experiment-showData.view?rowId=6648',
                    parents: [],
                    rowId: 6648,
                },
            },
        });
        const resolvedLinks = resolver.resolveLineageItem(
            lineageResult.nodes.get('urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4')
        );

        expect(resolvedLinks.list).toEqual('#/rd/dataclass/Source%201');
        expect(resolvedLinks.overview).toEqual('#/rd/expdata/6648');
    });

    test('accepted types', () => {
        const lineageResult = LineageResult.create(lineageJSON);
        let resolvedLinks = resolver.resolveLineageItem(
            lineageResult.nodes.get('urn:lsid:labkey.com:Sample.61.Hemoglobin:Hgb3.3')
        );
        // test a sample type
        expect(resolvedLinks.list).toEqual('#/samples/Hemoglobin');
        expect(resolvedLinks.overview).toEqual('#/rd/samples/6814');

        // TODO test that the run node doesn't show up
        resolvedLinks = resolver.resolveLineageItem(
            lineageResult.nodes.get('urn:lsid:labkey.com:Run.Folder-61:dbcee598-54f9-1038-9426-08c060dcd006')
        );

        expect(resolvedLinks.list).toEqual(undefined);
        expect(resolvedLinks.overview).toEqual('/labkey/ExampleLineage/experiment-showRunGraph.view?rowId=794');
    });
});

describe('parsePathName', () => {
    test('old style', () => {
        const url = '/labkey/controller/my%20folder/my%20path/action.view?extra=123';
        expect(parsePathName(url)).toEqual({
            controller: 'controller',
            action: 'action',
            containerPath: '/my folder/my path',
        });
    });

    test('new style', () => {
        const url = '/labkey/my%20folder/my%20path/controller-action.view?extra=123';
        expect(parsePathName(url)).toEqual({
            controller: 'controller',
            action: 'action',
            containerPath: '/my folder/my path',
        });
    });

    test('controller with dash', () => {
        const url = '/labkey/my%20folder/my%20path/pipeline-status-details.view?rowId=123';
        expect(parsePathName(url)).toEqual({
            controller: 'pipeline-status',
            action: 'details',
            containerPath: '/my folder/my path',
        });
    });

    test('controller with dash - old style', () => {
        const url = '/labkey/pipeline-status/my%20folder/my%20path/details.view?rowId=123';
        expect(parsePathName(url)).toEqual({
            controller: 'pipeline-status',
            action: 'details',
            containerPath: '/my folder/my path',
        });
    });
});
