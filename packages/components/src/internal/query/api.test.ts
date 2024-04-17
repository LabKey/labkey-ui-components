import { List } from 'immutable';
import { Query } from '@labkey/api';

import { TEST_PROJECT_CONTAINER, TEST_FOLDER_CONTAINER } from '../containerFixtures';

import {
    EXPERIMENTAL_PRODUCT_ALL_FOLDER_LOOKUPS,
    EXPERIMENTAL_PRODUCT_PROJECT_DATA_LISTING_SCOPED,
} from '../app/constants';

import { ModuleContext } from '../components/base/ServerContext';

import {
    getContainerFilter,
    getContainerFilterForFolder,
    getContainerFilterForLookups,
    ISelectRowsResult,
    quoteValueColumnWithDelimiters,
    Renderers,
    splitRowsByContainer,
} from './api';

describe('api', () => {
    describe('applyDetailRenderer', () => {
        test('various types', () => {
            expect(
                Renderers.applyDetailRenderer({}, { multiValue: false, type: 'text', friendlyType: 'text' }, {})
            ).toBeUndefined();
            expect(
                Renderers.applyDetailRenderer({}, { multiValue: true, type: 'text', friendlyType: 'text' }, {})
            ).toBe('MultiValueDetailRenderer');
            expect(Renderers.applyDetailRenderer({}, { type: 'file', friendlyType: 'text' }, {})).toBe(
                'FileColumnRenderer'
            );
            expect(Renderers.applyDetailRenderer({}, { type: 'text', friendlyType: 'file' }, {})).toBe(
                'FileColumnRenderer'
            );
            expect(
                Renderers.applyDetailRenderer({}, { type: 'text', friendlyType: 'text', lookup: {} }, {})
            ).toBeUndefined();
            expect(
                Renderers.applyDetailRenderer(
                    {},
                    { type: 'text', friendlyType: 'text', lookup: { schemaName: 'core', queryName: 'test' } },
                    {}
                )
            ).toBeUndefined();
            expect(
                Renderers.applyDetailRenderer(
                    {},
                    { type: 'text', friendlyType: 'text', lookup: { schemaName: 'core', queryName: 'users' } },
                    {}
                )
            ).toBe('UserDetailsRenderer');
            expect(
                Renderers.applyDetailRenderer(
                    {},
                    { type: 'text', friendlyType: 'text', lookup: { schemaName: 'core', queryName: 'siteusers' } },
                    {}
                )
            ).toBe('UserDetailsRenderer');
        });
    });

    describe('container filter utilities', () => {
        const topFolderPath = TEST_PROJECT_CONTAINER.path;
        const subFolderPath = TEST_FOLDER_CONTAINER.path;

        interface ModuleContextOptions {
            allFolderLookups?: boolean;
            isProductProjectsEnabled?: boolean;
            projectDataScoped?: boolean;
        }

        function moduleContext(options?: ModuleContextOptions): ModuleContext {
            return {
                query: {
                    [EXPERIMENTAL_PRODUCT_ALL_FOLDER_LOOKUPS]: options?.allFolderLookups ?? false,
                    [EXPERIMENTAL_PRODUCT_PROJECT_DATA_LISTING_SCOPED]: options?.projectDataScoped ?? false,
                    isProductProjectsEnabled: options?.isProductProjectsEnabled ?? true,
                },
            };
        }

        test('getContainerFilter', () => {
            expect(
                getContainerFilter(topFolderPath, moduleContext({ isProductProjectsEnabled: false }))
            ).toBeUndefined();
            expect(getContainerFilter(topFolderPath, moduleContext())).toEqual(
                Query.ContainerFilter.currentAndSubfoldersPlusShared
            );
            expect(getContainerFilter(subFolderPath, moduleContext())).toEqual(
                Query.ContainerFilter.currentPlusProjectAndShared
            );
            expect(getContainerFilter(topFolderPath, moduleContext({ allFolderLookups: true }))).toEqual(
                Query.ContainerFilter.allInProjectPlusShared
            );
            expect(getContainerFilter(subFolderPath, moduleContext({ allFolderLookups: true }))).toEqual(
                Query.ContainerFilter.allInProjectPlusShared
            );
        });

        test('getContainerFilterForFolder', () => {
            expect(
                getContainerFilterForFolder(topFolderPath, moduleContext({ isProductProjectsEnabled: false }))
            ).toBeUndefined();
            expect(getContainerFilterForFolder(topFolderPath, moduleContext())).toEqual(
                Query.ContainerFilter.currentAndSubfoldersPlusShared
            );
            expect(getContainerFilterForFolder(subFolderPath, moduleContext())).toEqual(
                Query.ContainerFilter.currentPlusProjectAndShared
            );
            expect(
                getContainerFilterForFolder(
                    topFolderPath,
                    moduleContext({ allFolderLookups: true, projectDataScoped: true })
                )
            ).toEqual(Query.ContainerFilter.allInProjectPlusShared);
            expect(getContainerFilterForFolder(topFolderPath, moduleContext({ projectDataScoped: true }))).toEqual(
                Query.ContainerFilter.currentAndSubfoldersPlusShared
            );
            expect(getContainerFilterForFolder(subFolderPath, moduleContext({ projectDataScoped: true }))).toEqual(
                Query.ContainerFilter.current
            );
        });

        test('getContainerFilterForLookups', () => {
            expect(getContainerFilterForLookups(moduleContext({ isProductProjectsEnabled: false }))).toBeUndefined();
            expect(getContainerFilterForLookups(moduleContext())).toEqual(
                Query.ContainerFilter.currentPlusProjectAndShared
            );
            expect(getContainerFilterForLookups(moduleContext({ allFolderLookups: true }))).toEqual(
                Query.ContainerFilter.allInProjectPlusShared
            );
        });
    });

    describe('quoteValueColumnWithDelimiters', () => {
        const results: ISelectRowsResult = {
            key: 'test',
            models: {
                test: {
                    1: { Name: { value: 'one', url: 'http://one/test' } },
                    2: { Name: { value: 'with, comma', url: 'http://with, comma/test' } },
                    4: { Name: { value: 'with "quotes", and comma' } },
                    3: { NoName: { value: 'nonesuch', url: 'http://with, comma/test' } },
                    5: { Name: { value: ', comma first', displayValue: ',', url: 'http://with, comma/test' } },
                },
            },
            orderedModels: List([1, 2, 3, 4, 5]),
            queries: {},
            rowCount: 5,
        };
        test('encode', () => {
            expect(quoteValueColumnWithDelimiters(results, 'Name', ',')).toStrictEqual({
                key: 'test',
                models: {
                    test: {
                        1: { Name: { value: 'one', url: 'http://one/test', displayValue: 'one' } },
                        2: {
                            Name: {
                                value: '"with, comma"',
                                url: 'http://with, comma/test',
                                displayValue: 'with, comma',
                            },
                        },
                        4: {
                            Name: {
                                value: '"with ""quotes"", and comma"',
                                url: undefined,
                                displayValue: 'with "quotes", and comma',
                            },
                        },
                        3: { NoName: { value: 'nonesuch', url: 'http://with, comma/test' } },
                        5: { Name: { value: '", comma first"', displayValue: ',', url: 'http://with, comma/test' } },
                    },
                },
                orderedModels: List([1, 2, 3, 4, 5]),
                queries: {},
                rowCount: 5,
            });
        });
    });

    test('splitRowsByContainer', () => {
        const rows = [{ container: 'a' }, { container: 'b' }, { container: 'a' }, { container: 'b' }];
        expect(splitRowsByContainer(rows, 'container')).toStrictEqual({
            a: [{ container: 'a' }, { container: 'a' }],
            b: [{ container: 'b' }, { container: 'b' }],
        });
        expect(splitRowsByContainer(rows, 'bogus')).toStrictEqual({
            undefined: [{ container: 'a' }, { container: 'b' }, { container: 'a' }, { container: 'b' }],
        });

        const rows2 = [{ container: undefined }, { container: 'b' }, { container: 'a' }, { container: 'b' }];
        expect(splitRowsByContainer(rows2, 'container')).toStrictEqual({
            undefined: [{ container: undefined }],
            a: [{ container: 'a' }],
            b: [{ container: 'b' }, { container: 'b' }],
        });
    });
});
