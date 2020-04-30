import { fromJS } from 'immutable';

import entitiesJSON from '../test/data/sampleSetSearchResult.json';
import lineageJSON from '../test/data/experiment-lineage.json';
import { LineageResult } from '../components/lineage/models';

import { parsePathName, URLResolver } from './URLResolver';

describe('resolveSearchUsingIndex', () => {
    test('resolve Sample Set url', () => {
        const resolver = new URLResolver();
        const testJson = fromJS(entitiesJSON);
        return resolver.resolveSearchUsingIndex(testJson).then(resolved => {
            expect(resolved).toHaveProperty(['hits']);
            expect(resolved).toHaveProperty(['hits', 0]);
            expect(resolved).toHaveProperty(['hits', 0, 'url'], '#/samples/molecule');
            expect(resolved).toHaveProperty(['hits', 0, 'data', 'name'], 'Molecule'); // not sure if this is best place to check this...
        });
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
});

describe('resolveLineage', () => {
    const resolver = new URLResolver();

    test('no accepted types', () => {
        const lineageResult = LineageResult.create(lineageJSON);
        // shouldn't change anything if none of the results are accepted
        expect(resolver.resolveLineageNodes(lineageResult, ['Nonesuch'])).toStrictEqual(lineageResult);
    });

    test('no cpasType', () => {
        const lineageResult = LineageResult.create({
            seed: 'urn:lsid:labkey.com:Sample.9273.ExpressionSystemSamples:ES-1.2',
            nodes: {
                'urn:lsid:labkey.com:Sample.9273.ExpressionSystemSamples:ES-1.201': {
                    relatedChildSample: true,
                    children: [
                        {
                            lsid: 'urn:lsid:labkey.com:Run.Folder-9273:a50adb6a-a194-1037-a047-595602e5f80e',
                            role: 'no role',
                        },
                    ],
                    name: 'ES-1.201',
                    queryName: 'ExpressionSystemSamples',
                    type: 'Sample',
                    schemaName: 'samples',
                    url: '/labkey/BiologicsAssayTest%20Project/experiment-showMaterial.view?rowId=176708',
                    parents: [
                        {
                            lsid: 'urn:lsid:labkey.com:Run.Folder-9273:a50adb68-a194-1037-a047-595602e5f80e',
                            role: 'no role',
                        },
                    ],
                    rowId: 176708,
                },
            },
        });
        // change nothing if there is no cpasType (not sure when this happens...)
        expect(resolver.resolveLineageNodes(lineageResult)).toStrictEqual(lineageResult);
    });

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
        const updatedResults = resolver.resolveLineageNodes(lineageResult);
        expect(
            updatedResults.getIn([
                'nodes',
                'urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4',
                'listURL',
            ])
        ).toEqual('#/rd/dataclass/source%201');
        expect(
            updatedResults.getIn([
                'nodes',
                'urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4',
                'url',
            ])
        ).toEqual('#/rd/expdata/6648');
    });

    test('accepted types', () => {
        const lineageResult = LineageResult.create(lineageJSON);
        const updatedResults = resolver.resolveLineageNodes(lineageResult);
        // test a sample type
        expect(updatedResults.getIn(['nodes', 'urn:lsid:labkey.com:Sample.61.Hemoglobin:Hgb3.3', 'listURL'])).toBe(
            '#/samples/hemoglobin'
        );
        expect(updatedResults.getIn(['nodes', 'urn:lsid:labkey.com:Sample.61.Hemoglobin:Hgb3.3', 'url'])).toBe(
            '#/rd/samples/6814'
        );

        // TODO test that the run node doesn't show up
        expect(
            updatedResults.getIn([
                'nodes',
                'urn:lsid:labkey.com:Run.Folder-61:dbcee598-54f9-1038-9426-08c060dcd006',
                'listURL',
            ])
        ).toBe(undefined);
        expect(
            updatedResults.getIn([
                'nodes',
                'urn:lsid:labkey.com:Run.Folder-61:dbcee598-54f9-1038-9426-08c060dcd006',
                'url',
            ])
        ).toBe('/labkey/ExampleLineage/experiment-showRunGraph.view?rowId=794');
    });
});
