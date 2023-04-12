import { List } from 'immutable';

import { SampleCreationType } from '../samples/models';

import {
    TEST_LKS_STARTER_MODULE_CONTEXT,
    TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
    TEST_LKSM_STARTER_AND_WORKFLOW_MODULE_CONTEXT,
    TEST_LKSM_STARTER_MODULE_CONTEXT,
} from '../../productFixtures';

import { IEntityTypeOption } from './models';
import {
    getBulkCreationTypeOptions,
    getEntityDescription,
    getEntityNoun,
    getInitialParentChoices,
    sampleDeleteDependencyText,
} from './utils';
import { DataClassDataType, SampleTypeDataType } from './constants';

describe('getInitialParentChoices', () => {
    const parentTypeOptions = List<IEntityTypeOption>([
        {
            label: 'Second Source',
            lsid: 'urn:lsid:labkey.com:DataClass.Folder-252:Second+Source',
            rowId: 322,
            value: 'second source',
            query: 'Second Source',
            schema: 'exp.data',
        },
        {
            label: 'Source 1',
            lsid: 'urn:lsid:labkey.com:DataClass.Folder-252:Source+1',
            rowId: 321,
            value: 'source 1',
            query: 'Source 1',
            schema: 'exp.data',
        },
        {
            label: 'Vendor 3',
            lsid: 'urn:lsid:labkey.com:DataClass.Folder-252:Vendor+3',
            rowId: 323,
            value: 'vendor 3',
            query: 'Vendor 3',
            schema: 'exp.data',
        },
    ]);

    test('empty child data', () => {
        const parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, {}, {});
        expect(parentChoices.size).toBe(0);
    });

    test('no data', () => {
        const parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, {}, {});
        expect(parentChoices.size).toBe(0);
    });

    test('missing parent type', () => {
        const parentIdData = {
            'urn:lsid:labkey.com:Data.Folder-252:1fce5b0b-33ce-1038-8604-d42714b6919e': {
                rowId: 123,
                parentId: 321,
            },
        };
        const parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, {}, parentIdData);
        expect(parentChoices.size).toBe(0);
    });

    test('multiple inputs and types', () => {
        const data = {
            LSID: {
                value: 'urn:lsid:labkey.com:Sample.252.Examples:E-20200316-10',
            },
            'Inputs/Materials/First': [],
            RowId: {
                value: 53703,
                url: '/labkey/Sam%20Man/experiment-showMaterial.view?rowId=53703',
            },
            CreatedBy: {
                displayValue: 'Susan',
                value: 1005,
                url: '/labkey/Sam%20Man/user-details.view?schemaName=core&query.queryName=Users&userId=1005',
            },
            Modified: {
                value: '2020-03-16 15:54:28.037',
                formattedValue: '2020-03-16 15:54',
            },
            Description: {
                value: null,
            },
            'Inputs/Data/First': [
                {
                    displayValue: 'B-50118',
                    value: 'urn:lsid:labkey.com:Data.Folder-252:a49f277e-301e-1038-a031-328bafaf2618',
                    url: '/labkey/Sam%20Man/experiment-showData.view?rowId=7067&dataClassId=321',
                },
                {
                    displayValue: 'B-50117',
                    value: 'urn:lsid:labkey.com:Data.Folder-252:a49f277f-301e-1038-a031-328bafaf2618',
                    url: '/labkey/Sam%20Man/experiment-showData.view?rowId=7068&dataClassId=321',
                },
                {
                    displayValue: 'B-50116',
                    value: 'urn:lsid:labkey.com:Data.Folder-252:a49f2780-301e-1038-a031-328bafaf2618',
                    url: '/labkey/Sam%20Man/experiment-showData.view?rowId=7069&dataClassId=321',
                },
                {
                    displayValue: 'Sec-2',
                    value: 'urn:lsid:labkey.com:Data.Folder-252:604347b2-3103-1038-91ee-da4874ca890e',
                    url: '/labkey/Sam%20Man/experiment-showData.view?rowId=57088&dataClassId=322',
                },
            ],
            Run: {
                displayValue: 'Derive sample from B-50116, B-50117, B-50118, Sec-2',
                value: 2297,
                url: '/labkey/Sam%20Man/experiment-showRunText.view?rowId=2297',
            },
            IntField: {
                value: 3,
            },
            ModifiedBy: {
                displayValue: 'Susan',
                value: 1005,
                url: '/labkey/Sam%20Man/user-details.view?schemaName=core&query.queryName=Users&userId=1005',
            },
            Created: {
                value: '2020-03-16 11:52:58.540',
                formattedValue: '2020-03-16 11:52',
            },
            Name: {
                value: 'E-20200316-10',
                url: '/labkey/Sam%20Man/experiment-showMaterial.view?rowId=53703',
            },
            SampleSet: {
                displayValue: 'Examples',
                value: 'urn:lsid:labkey.com:SampleSet.Folder-252:Examples',
                url: '/labkey/Sam%20Man/experiment-showMaterialSource.view?rowId=205',
            },
            TextField: {
                value: null,
            },
        };
        const parentIdData = {
            'urn:lsid:labkey.com:Data.Folder-252:a49f277e-301e-1038-a031-328bafaf2618': {
                rowId: 1,
                parentId: 321,
            },
            'urn:lsid:labkey.com:Data.Folder-252:a49f277f-301e-1038-a031-328bafaf2618': {
                rowId: 2,
                parentId: 321,
            },
            'urn:lsid:labkey.com:Data.Folder-252:a49f2780-301e-1038-a031-328bafaf2618': {
                rowId: 3,
                parentId: 321,
            },
            'urn:lsid:labkey.com:Data.Folder-252:604347b2-3103-1038-91ee-da4874ca890e': {
                rowId: 4,
                parentId: 322,
            },
        };
        const parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, data, parentIdData);
        expect(parentChoices.size).toBe(2);
        const firstChoice = parentChoices.get(0);
        expect(firstChoice.type.label).toBe('Second Source');
        expect(firstChoice.ids).toStrictEqual([
            'urn:lsid:labkey.com:Data.Folder-252:604347b2-3103-1038-91ee-da4874ca890e',
        ]);
        const secondChoice = parentChoices.get(1);
        expect(secondChoice.type.label).toBe('Source 1');
        expect(secondChoice.ids).toStrictEqual([
            'urn:lsid:labkey.com:Data.Folder-252:a49f277e-301e-1038-a031-328bafaf2618',
            'urn:lsid:labkey.com:Data.Folder-252:a49f277f-301e-1038-a031-328bafaf2618',
            'urn:lsid:labkey.com:Data.Folder-252:a49f2780-301e-1038-a031-328bafaf2618',
        ]);
    });
});

describe('getEntityDescription', () => {
    test('zero', () => {
        expect(getEntityDescription(DataClassDataType, 0)).toBe('parent types');
    });
    test('one', () => {
        expect(getEntityDescription(DataClassDataType, 1)).toBe('parent type');
    });
    test('multiple', () => {
        expect(getEntityDescription(DataClassDataType, 2)).toBe('parent types');
    });
});

describe('getEntityNoun', () => {
    test('zero', () => {
        expect(getEntityNoun(SampleTypeDataType, 0)).toBe('samples');
    });
    test('one', () => {
        expect(getEntityNoun(SampleTypeDataType, 1)).toBe('sample');
    });
    test('multiple', () => {
        expect(getEntityNoun(SampleTypeDataType, 2)).toBe('samples');
    });
});

describe('getBulkCreationTypeOptions', () => {
    test('aliquot creation', () => {
        let options = getBulkCreationTypeOptions(false, SampleCreationType.Aliquots);
        expect(options.length).toBe(1);
        expect(options[0].type).toBe(SampleCreationType.Aliquots);
        expect(options[0].selected).toBe(true);

        options = getBulkCreationTypeOptions(true, SampleCreationType.Aliquots);
        expect(options.length).toBe(1);
        expect(options[0].type).toBe(SampleCreationType.Aliquots);
        expect(options[0].selected).toBe(true);
    });

    test('not hasParentSamples for non-aliqout creation', () => {
        let options = getBulkCreationTypeOptions(false, SampleCreationType.Independents);
        expect(options.length).toBe(1);
        expect(options[0].type).toBe(SampleCreationType.Independents);
        expect(options[0].quantityLabel).toBe('New Samples');
        expect(options[0].selected).toBe(true);

        options = getBulkCreationTypeOptions(false, SampleCreationType.Derivatives);
        expect(options.length).toBe(1);
        expect(options[0].type).toBe(SampleCreationType.Independents);
        expect(options[0].quantityLabel).toBe('New Samples');
        expect(options[0].selected).toBe(true);

        options = getBulkCreationTypeOptions(false, SampleCreationType.PooledSamples);
        expect(options.length).toBe(1);
        expect(options[0].type).toBe(SampleCreationType.Independents);
        expect(options[0].quantityLabel).toBe('New Samples');
        expect(options[0].selected).toBe(true);
    });

    test('hasParentSamples for non-aliqout creation', () => {
        let options = getBulkCreationTypeOptions(true, SampleCreationType.Independents);
        expect(options.length).toBe(2);
        expect(options[0].type).toBe(SampleCreationType.Derivatives);
        expect(options[0].selected).toBe(true);
        expect(options[1].type).toBe(SampleCreationType.PooledSamples);
        expect(options[1].selected).toBe(false);

        options = getBulkCreationTypeOptions(true, SampleCreationType.Derivatives);
        expect(options.length).toBe(2);
        expect(options[0].type).toBe(SampleCreationType.Derivatives);
        expect(options[0].selected).toBe(true);
        expect(options[1].type).toBe(SampleCreationType.PooledSamples);
        expect(options[1].selected).toBe(false);

        options = getBulkCreationTypeOptions(true, SampleCreationType.PooledSamples);
        expect(options.length).toBe(2);
        expect(options[0].type).toBe(SampleCreationType.Derivatives);
        expect(options[0].selected).toBe(false);
        expect(options[1].type).toBe(SampleCreationType.PooledSamples);
        expect(options[1].selected).toBe(true);
    });
});

describe('sampleDeleteDependencyText', () => {
    test('cannot delete, professional', () => {
        LABKEY.moduleContext = { ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT };
        expect(sampleDeleteDependencyText()).toBe(
            'either derived sample, job, or assay data dependencies, status that prevents deletion, or references in one or more active notebooks'
        );
    });

    test('cannot delete, no workflow', () => {
        LABKEY.moduleContext = { ...TEST_LKS_STARTER_MODULE_CONTEXT };
        expect(sampleDeleteDependencyText()).toBe(
            'either derived sample or assay data dependencies, or status that prevents deletion'
        );
    });

    test('cannot delete, workflow no assay', () => {
        LABKEY.moduleContext = { ...TEST_LKSM_STARTER_AND_WORKFLOW_MODULE_CONTEXT };
        expect(sampleDeleteDependencyText()).toBe(
            'either derived sample or job dependencies, or status that prevents deletion'
        );
    });

    test('cannot delete no workflow or assay', () => {
        LABKEY.moduleContext = { ...TEST_LKSM_STARTER_MODULE_CONTEXT };
        expect(sampleDeleteDependencyText()).toBe('derived sample dependencies or status that prevents deletion');
    });
});
