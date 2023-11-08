import { fromJS } from 'immutable';

import entitiesJSON from '../../test/data/sampleSetSearchResult.json';
import lineageJSON from '../../test/data/experiment-lineage.json';
import { LineageResult } from '../components/lineage/models';

import { registerDefaultURLMappers } from '../test/testHelpers';

import { LookupMapper, URLResolver } from './URLResolver';
import { AppURL } from './AppURL';

beforeAll(() => {
    LABKEY.container = {
        id: 'testContainerEntityId',
        title: 'Test Container',
        path: '/testContainer',
    };

    registerDefaultURLMappers();
});

describe('resolveSearchUsingIndex', () => {
    test('resolve Sample Set url', () => {
        const resolver = new URLResolver();

        const testJson = fromJS(entitiesJSON);
        const resolved = resolver.resolveSearchUsingIndex(testJson);
        expect(resolved).toHaveProperty(['hits']);
        expect(resolved).toHaveProperty(['hits', 0]);
        expect(resolved).toHaveProperty(['hits', 0, 'url'], '#/samples/Molecule');
        expect(resolved).toHaveProperty(['hits', 0, 'data', 'name'], 'Molecule'); // not sure if this is best place to check this...
    });
});

describe('LookupMapper', () => {
    test('resolve without lookup container', () => {
        const mapper = new LookupMapper('test', undefined);
        const resolved = mapper.resolve(
            '#/list/a',
            fromJS({ value: 1 }),
            fromJS({ lookup: { schemaName: 'list', queryName: 'testing' } })
        );
        expect(resolved).toStrictEqual(AppURL.create('test', 'list', 'testing', 1));
    });

    test('resolve with lookup container same as current', () => {
        const mapper = new LookupMapper('test', undefined);
        const resolved = mapper.resolve(
            '#/list/a',
            fromJS({ value: 1 }),
            fromJS({ lookup: { schemaName: 'list', queryName: 'testing', containerPath: LABKEY.container.path } })
        );
        expect(resolved).toStrictEqual(AppURL.create('test', 'list', 'testing', 1));
    });

    test('resolve with different lookup container', () => {
        const mapper = new LookupMapper('test', undefined);
        const resolved = mapper.resolve(
            '#/list/a',
            fromJS({ value: 1 }),
            fromJS({ lookup: { schemaName: 'list', queryName: 'testing', containerPath: '/other/path' } })
        );
        expect(resolved).toBeUndefined();
    });
});

describe('resolveLineage', () => {
    const resolver = new URLResolver();

    const node = {
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
        url: '/labkey/testContainer/experiment-showData.view?rowId=6648',
        parents: [],
        rowId: 6648,
    };

    test('name with spaces', () => {
        const lineageResult = LineageResult.create({
            seed: 'urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4',
            nodes: {
                'urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4': node,
            },
        });
        const resolvedLinks = resolver.resolveLineageItem(
            lineageResult.nodes.get('urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4')
        );

        expect(resolvedLinks.list).toEqual('#/rd/dataclass/Source%201');
        expect(resolvedLinks.overview).toEqual('#/rd/expdata/6648');
    });

    test('url to different container', () => {
        const url = '/labkey/otherContainer/experiment-showData.view?rowId=6648';
        node['url'] = url;
        const lineageResult = LineageResult.create({
            seed: 'urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4',
            nodes: {
                'urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4': node,
            },
        });
        const resolvedLinks = resolver.resolveLineageItem(
            lineageResult.nodes.get('urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4')
        );

        expect(resolvedLinks.list).toEqual('#/rd/dataclass/Source%201');
        expect(resolvedLinks.overview).toEqual(url);
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
        expect(resolvedLinks.overview).toEqual('/labkey/testContainer/experiment-showRunGraph.view?rowId=794');

        // Issue 48836: resolve list URL via queryName if available
        // Note that the node "urn:lsid:labkey.com:Sample.61.Hemoglobin:Hgb3.3-clone" uses
        // the new "cpasType" which does not include the name of the sample type.
        resolvedLinks = resolver.resolveLineageItem(
            lineageResult.nodes.get('urn:lsid:labkey.com:Sample.61.Hemoglobin:Hgb3.3-clone')
        );
        expect(resolvedLinks.list).toEqual('#/samples/shemoglobin');
    });
});
