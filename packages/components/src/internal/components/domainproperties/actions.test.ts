/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { List } from 'immutable';

import { Domain } from '@labkey/api';

import { QueryColumn } from '../../../public/QueryColumn';

import { ConceptModel, OntologyModel } from '../ontology/models';

import { createFormInputId } from './utils';
import {
    getAvailableTypes,
    getAvailableTypesForOntology,
    getBannerMessages,
    getDomainAlertClasses,
    getDomainBottomErrorMessage,
    getDomainHeaderName,
    getDomainPanelClass,
    getDomainPanelHeaderId,
    getDomainPanelStatus,
    getOntologyUpdatedFieldName,
    setDomainFields,
    updateDomainException,
    updateOntologyFieldProperties,
    processJsonImport,
    downloadJsonFile,
    updateErrorIndexes,
    removeFields,
    updateDataType,
    updateDomainField,
} from './actions';
import { DEFAULT_TEXT_CHOICE_VALIDATOR, DomainDesign, DomainException, DomainField, IFieldChange } from './models';
import {
    ATTACHMENT_TYPE,
    DATETIME_TYPE,
    DOUBLE_TYPE,
    FILE_TYPE,
    FLAG_TYPE,
    INTEGER_TYPE,
    ONTOLOGY_LOOKUP_TYPE,
    TEXT_TYPE,
    VISIT_DATE_TYPE,
    VISIT_ID_TYPE,
    UNIQUE_ID_TYPE,
    BOOLEAN_TYPE,
    USERS_TYPE,
    TEXT_CHOICE_TYPE,
    SAMPLE_TYPE,
    PARTICIPANT_TYPE,
} from './PropDescType';
import {
    CONCEPT_CODE_CONCEPT_URI,
    DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT,
    DOMAIN_FIELD_PREFIX,
    FIELD_NAME_CHAR_WARNING_INFO,
    FIELD_NAME_CHAR_WARNING_MSG,
    FLAG_CONCEPT_URI,
    INT_RANGE_URI,
    MAX_TEXT_LENGTH,
    SEVERITY_LEVEL_ERROR,
    SEVERITY_LEVEL_WARN,
    STRING_RANGE_URI,
} from './constants';
import { getDomainPropertiesTestAPIWrapper } from './APIWrapper';

describe('domain properties actions', () => {
    test('create id', () => {
        return expect(createFormInputId('marty', 0, 100)).toBe(DOMAIN_FIELD_PREFIX + '-marty-0-100');
    });

    test('get field type', () => {
        const field1 = DomainField.create({
            name: 'field1name',
            rangeURI: INT_RANGE_URI,
            propertyId: 0,
            propertyURI: 'test',
        });
        expect(field1.dataType.rangeURI).toBe(INT_RANGE_URI);

        const field2 = DomainField.create({
            name: 'field2name',
            rangeURI: STRING_RANGE_URI,
            conceptURI: FLAG_CONCEPT_URI,
            propertyId: 0,
            propertyURI: 'test',
        });
        expect(field2.dataType.name).toBe('flag');

        const field3 = DomainField.create({
            name: 'field3name',
            rangeURI: INT_RANGE_URI,
            lookupSchema: 'core',
            lookupQuery: 'users',
            propertyId: 0,
            propertyURI: 'test',
        });
        expect(field3.dataType.name).toBe('users');
    });

    test('server side error on the banner', () => {
        const fields = [];
        const field1 = 'column1';
        const field2 = 'modified';

        fields.push({
            name: field1,
            rangeURI: INT_RANGE_URI,
            propertyId: 1, // simulate existing field
            propertyURI: 'test',
        });

        fields.push({
            name: field1,
            rangeURI: INT_RANGE_URI,
            propertyId: undefined, // new field with duplicate column name
            propertyURI: 'test',
        });

        let message = "The field name 'column1' is already taken. Please provide a unique name for each field.";
        const domainFieldError = [];
        domainFieldError.push({ message, field: field1, id: 0 });
        let rawModel = { exception: message, success: false, errors: domainFieldError };
        let domainException = DomainException.create(rawModel, SEVERITY_LEVEL_ERROR);

        let domain = DomainDesign.create({
            name: 'CancerCuringStudy',
            schemaName: 'Study',
            queryName: 'CancerCuringStudy',
            description: 'description',
            domainURI: 'test',
            domainId: 123,
            fields,
            indices: [],
        });
        let badDomain = domain.set('domainException', domainException);

        expect(badDomain.get('domainException').errors.get(0).message).toBe(message);
        expect(getBannerMessages(badDomain).get(0).message).toBe(message);

        fields.push({
            name: field2, // reserved field
            rangeURI: INT_RANGE_URI,
            propertyId: undefined,
            propertyURI: 'test',
        });

        const multipleErrorMsg =
            'Multiple fields contain issues that need to be fixed. Review the red highlighted fields above for more information.';

        message = "'modified' is a reserved field name in 'CancerCuringStudy'";
        domainFieldError.push({ message, field: field2, id: 1 });
        rawModel = { exception: message, success: false, errors: domainFieldError };
        domainException = DomainException.create(rawModel, SEVERITY_LEVEL_ERROR);

        domain = DomainDesign.create({
            name: 'CancerCuringStudy',
            schemaName: 'Study',
            queryName: 'CancerCuringStudy',
            description: 'description',
            domainURI: 'test',
            domainId: 123,
            fields,
            indices: [],
        });
        badDomain = domain.set('domainException', domainException);

        expect(getBannerMessages(badDomain).get(0).message).toBe(multipleErrorMsg);
    });

    test('client side warning on the banner', () => {
        const fields = [];
        fields.push({
            name: '#column#',
            rangeURI: INT_RANGE_URI,
            propertyId: undefined,
            propertyURI: 'test',
        });

        const fieldName = '#column#';
        const domainFieldError = [];
        domainFieldError.push({
            message: FIELD_NAME_CHAR_WARNING_MSG,
            extraInfo: FIELD_NAME_CHAR_WARNING_INFO,
            fieldName,
            propertyId: undefined,
            severity: SEVERITY_LEVEL_WARN,
        });

        const domain = DomainDesign.create(
            {
                name: 'CancerCuringStudy',
                description: 'description',
                domainURI: 'test',
                domainId: 123,
                fields,
                indices: [],
            },
            undefined
        );

        const updatedDomain = updateDomainException(domain, 0, domainFieldError);
        expect(updatedDomain.domainException.get('errors').get(0)[0].message).toBe(FIELD_NAME_CHAR_WARNING_MSG);
    });

    test('setDomainFields', () => {
        const initDomain = DomainDesign.create({
            name: 'Foo',
            fields: [
                { name: 'text', rangeURI: TEXT_TYPE.rangeURI },
                { name: 'int', rangeURI: INTEGER_TYPE.rangeURI },
            ],
        });
        expect(initDomain.fields.size).toBe(2);
        expect(initDomain.fields.get(0).rangeURI).toBe(TEXT_TYPE.rangeURI);
        expect(initDomain.fields.get(1).rangeURI).toBe(INTEGER_TYPE.rangeURI);

        const newFields = [
            new QueryColumn({ name: 'text', rangeURI: TEXT_TYPE.rangeURI }),
            new QueryColumn({ name: 'dbl', rangeURI: DOUBLE_TYPE.rangeURI }),
            new QueryColumn({ name: 'dt', rangeURI: DATETIME_TYPE.rangeURI }),
        ];

        const updatedDomain = setDomainFields(initDomain, List<QueryColumn>(newFields));
        expect(updatedDomain.fields.size).toBe(3);
        expect(updatedDomain.fields.get(0).rangeURI).toBe(TEXT_TYPE.rangeURI);
        expect(updatedDomain.fields.get(1).rangeURI).toBe(DOUBLE_TYPE.rangeURI);
        expect(updatedDomain.fields.get(2).rangeURI).toBe(DATETIME_TYPE.rangeURI);
    });

    test('getDomainPanelStatus', () => {
        expect(getDomainPanelStatus(0, 0, List.of(0), true)).toBe('NONE');
        expect(getDomainPanelStatus(0, 0, List.of(0), false)).toBe('INPROGRESS');
        expect(getDomainPanelStatus(1, 1, List.of(0, 1), false)).toBe('INPROGRESS');
        expect(getDomainPanelStatus(0, 1, List.of(0), false)).toBe('COMPLETE');
        expect(getDomainPanelStatus(1, 0, List.of(0, 1), true)).toBe('COMPLETE');
        expect(getDomainPanelStatus(1, 0, List.of(0, 1), false)).toBe('COMPLETE');
        expect(getDomainPanelStatus(1, 0, List.of(0), false)).toBe('TODO');
    });

    test('getDomainBottomErrorMessage', () => {
        expect(getDomainBottomErrorMessage('Test exception', List.of(), true, List.of())).toBe('Test exception');
        expect(getDomainBottomErrorMessage('Test exception', List.of('test1', 'test2'), true, List.of())).toBe(
            'Test exception'
        );
        expect(getDomainBottomErrorMessage('Test exception', List.of('test1'), false, List.of())).toBe(
            'Test exception'
        );
        expect(getDomainBottomErrorMessage('Test exception', List.of('test1'), true, List.of())).toBe('Test exception');
        expect(getDomainBottomErrorMessage('Test exception', List.of(), true, List.of(0))).toBe('Test exception');
        expect(getDomainBottomErrorMessage('Test exception', List.of(), false, List.of(0))).toBe('Test exception');

        expect(getDomainBottomErrorMessage(undefined, List.of('test1', 'test2'), true, List.of())).toContain(
            'errors above'
        );
        expect(getDomainBottomErrorMessage(undefined, List.of('test1'), false, List.of())).toContain('errors above');
        expect(getDomainBottomErrorMessage(undefined, List.of('test1'), true, List.of())).toContain('errors in test1');
        expect(getDomainBottomErrorMessage(undefined, List.of(), false, List.of(0))).toContain(
            'errors in the properties panel'
        );

        expect(getDomainBottomErrorMessage(undefined, List.of(), true, List.of())).toBe(undefined);
        expect(getDomainBottomErrorMessage(undefined, List.of(), true, List.of(0))).toBe(undefined);
    });

    test('getDomainPanelClass', () => {
        expect(getDomainPanelClass(true, true, false)).toBe('domain-form-panel');
        expect(getDomainPanelClass(true, true, true)).toBe('domain-form-panel');
        expect(getDomainPanelClass(true, false, false)).toBe('domain-form-panel');
        expect(getDomainPanelClass(true, false, true)).toBe('domain-form-panel');
        expect(getDomainPanelClass(false, true, false)).toBe('domain-form-panel lk-border-theme-light');
        expect(getDomainPanelClass(false, true, true)).toBe('domain-form-panel domain-panel-no-theme');
        expect(getDomainPanelClass(false, false, false)).toBe('domain-form-panel');
        expect(getDomainPanelClass(false, false, true)).toBe('domain-form-panel');
    });

    test('getDomainAlertClasses', () => {
        expect(getDomainAlertClasses(true, true, false)).toBe('domain-bottom-alert panel-default');
        expect(getDomainAlertClasses(true, false, false)).toBe('domain-bottom-alert panel-default');
        expect(getDomainAlertClasses(true, true, true)).toBe('domain-bottom-alert panel-default');
        expect(getDomainAlertClasses(true, false, true)).toBe('domain-bottom-alert panel-default');
        expect(getDomainAlertClasses(false, true, false)).toBe(
            'domain-bottom-alert panel-default lk-border-theme-light domain-bottom-alert-top'
        );
        expect(getDomainAlertClasses(false, true, true)).toBe(
            'domain-bottom-alert panel-default domain-bottom-alert-expanded domain-bottom-alert-top'
        );
        expect(getDomainAlertClasses(false, false, false)).toBe(
            'domain-bottom-alert panel-default domain-bottom-alert-top'
        );
        expect(getDomainAlertClasses(false, false, true)).toBe(
            'domain-bottom-alert panel-default domain-bottom-alert-top'
        );
    });

    test('getDomainPanelHeaderId', () => {
        expect(getDomainPanelHeaderId(undefined)).toBe('domain-header');
        expect(getDomainPanelHeaderId(undefined, 'domain-header-test')).toBe('domain-header-test');
        expect(getDomainPanelHeaderId(DomainDesign.create({}))).toBe('domain-header');
        expect(getDomainPanelHeaderId(DomainDesign.create({}), 'domain-header-test')).toBe('domain-header-test');
        expect(getDomainPanelHeaderId(DomainDesign.create({ name: 'test' }))).toBe('domainpropertiesrow-test-hdr');
        expect(getDomainPanelHeaderId(DomainDesign.create({ name: 'test' }), 'domain-header-test')).toBe(
            'domainpropertiesrow-test-hdr'
        );
    });

    test('getDomainHeaderName', () => {
        expect(getDomainHeaderName()).toBe('Fields');
        expect(getDomainHeaderName('Test Name')).toBe('Test Name');
        expect(getDomainHeaderName('Test Name', 'Test Header Title')).toBe('Test Header Title');
        expect(getDomainHeaderName('Test Name', undefined, 'Test')).toBe('Name');
        expect(getDomainHeaderName('Test Name', 'Test Header Title', 'Test')).toBe('Header Title');
        expect(getDomainHeaderName('TestName', undefined, 'Test')).toBe('TestName');
        expect(getDomainHeaderName('TestName', 'TestHeaderTitle', 'Test')).toBe('TestHeaderTitle');
        expect(getDomainHeaderName('Test Name', undefined, 'test')).toBe('Test Name');
        expect(getDomainHeaderName('Test Name', 'Test Header Title', 'test')).toBe('Test Header Title');
        expect(getDomainHeaderName('Data Fields')).toBe('Results Fields');
    });

    test('getAvailableTypes, all optional allowed', () => {
        const domain = DomainDesign.create({
            allowFlagProperties: true,
            allowFileLinkProperties: true,
            allowAttachmentProperties: true,
            allowTimepointProperties: true,
            allowTextChoiceProperties: true,
            allowSampleSubjectProperties: true,
        });
        const available = getAvailableTypes(domain);
        expect(available.contains(FLAG_TYPE)).toBeTruthy();
        expect(available.contains(FILE_TYPE)).toBeTruthy();
        expect(available.contains(ATTACHMENT_TYPE)).toBeTruthy();
        expect(available.contains(ONTOLOGY_LOOKUP_TYPE)).toBeFalsy();
        expect(available.contains(TEXT_TYPE)).toBeTruthy();
        expect(available.contains(VISIT_DATE_TYPE)).toBeTruthy();
        expect(available.contains(VISIT_ID_TYPE)).toBeTruthy();
        expect(available.contains(UNIQUE_ID_TYPE)).toBeFalsy();
        expect(available.contains(TEXT_CHOICE_TYPE)).toBeTruthy();
        expect(available.contains(SAMPLE_TYPE)).toBeTruthy();
        expect(available.contains(PARTICIPANT_TYPE)).toBeTruthy();
    });

    test('getAvailableTypes, no optional allowed', () => {
        const domain = DomainDesign.create({
            allowFlagProperties: false,
            allowFileLinkProperties: false,
            allowAttachmentProperties: false,
            allowTimepointProperties: false,
            allowTextChoiceProperties: false,
            allowSampleSubjectProperties: false,
        });
        const available = getAvailableTypes(domain);
        expect(available.contains(FLAG_TYPE)).toBeFalsy();
        expect(available.contains(FILE_TYPE)).toBeFalsy();
        expect(available.contains(ATTACHMENT_TYPE)).toBeFalsy();
        expect(available.contains(ONTOLOGY_LOOKUP_TYPE)).toBeFalsy();
        expect(available.contains(TEXT_TYPE)).toBeTruthy();
        expect(available.contains(VISIT_DATE_TYPE)).toBeFalsy();
        expect(available.contains(VISIT_ID_TYPE)).toBeFalsy();
        expect(available.contains(UNIQUE_ID_TYPE)).toBeFalsy();
        expect(available.contains(TEXT_CHOICE_TYPE)).toBeFalsy();
        expect(available.contains(SAMPLE_TYPE)).toBeFalsy();
        expect(available.contains(PARTICIPANT_TYPE)).toBeFalsy();
    });

    test('getAvailableTypesForOntology', async () => {
        const api = getDomainPropertiesTestAPIWrapper(jest.fn, {
            fetchOntologies: jest.fn().mockResolvedValue([
                new OntologyModel({
                    rowId: 2,
                    name: "Test HOM-UCARE-->\">'>'\"<script>alert('8(');</script>",
                    abbreviation: '45887',
                }),
                new OntologyModel({
                    rowId: 1,
                    name: 'Test National Cancer Institute Thesaurus',
                    abbreviation: 'NCIT',
                }),
            ]),
        });
        const domain = DomainDesign.create({});
        const types = await getAvailableTypesForOntology(api, domain);
        expect(types.contains(FLAG_TYPE)).toBeTruthy();
        expect(types.contains(FILE_TYPE)).toBeFalsy();
        expect(types.contains(ATTACHMENT_TYPE)).toBeFalsy();
        expect(types.contains(ONTOLOGY_LOOKUP_TYPE)).toBeTruthy();
        expect(types.contains(TEXT_TYPE)).toBeTruthy();
    });

    test('getAvailableTypes, sampleType LKSM', () => {
        LABKEY.moduleContext = {
            sampleManagement: {},
            api: {
                moduleNames: ['samplemanagement'],
            },
        };
        const domain = DomainDesign.create({
            domainKindName: Domain.KINDS.SAMPLE_TYPE,
        });
        const available = getAvailableTypes(domain);
        expect(available.contains(UNIQUE_ID_TYPE)).toBeTruthy();
    });

    test('getAvailableTypes, sampleType Premium', () => {
        LABKEY.moduleContext.api = { moduleNames: ['premium'] };
        const domain = DomainDesign.create({
            domainKindName: Domain.KINDS.SAMPLE_TYPE,
        });
        const available = getAvailableTypes(domain);
        expect(available.contains(UNIQUE_ID_TYPE)).toBeTruthy();
    });

    test('getAvailableTypes, sampleType community', () => {
        LABKEY.moduleContext.api = { moduleNames: ['api', 'core'] };
        const domain = DomainDesign.create({
            domainKindName: Domain.KINDS.SAMPLE_TYPE,
        });
        const available = getAvailableTypes(domain);
        expect(available.contains(UNIQUE_ID_TYPE)).toBeFalsy();
    });

    test('updateOntologyFieldProperties', () => {
        const origDomain = DomainDesign.create({
            fields: [
                {
                    name: 'ont',
                    rangeURI: TEXT_TYPE.rangeURI,
                    conceptURI: CONCEPT_CODE_CONCEPT_URI,
                    sourceOntology: 'SRC',
                    conceptImportColumn: 'text1',
                    conceptLabelColumn: 'text2',
                },
                { name: 'text1', rangeURI: TEXT_TYPE.rangeURI },
                { name: 'text2', rangeURI: TEXT_TYPE.rangeURI },
            ],
        });

        let testDomain = updateOntologyFieldProperties(0, 0, origDomain, origDomain, undefined);
        expect(testDomain.fields.get(0).sourceOntology).toBe('SRC');
        expect(testDomain.fields.get(0).conceptImportColumn).toBe('text1');
        expect(testDomain.fields.get(0).conceptLabelColumn).toBe('text2');

        const nameChangesDomain = DomainDesign.create({
            fields: [
                {
                    name: 'ont',
                    rangeURI: TEXT_TYPE.rangeURI,
                    conceptURI: CONCEPT_CODE_CONCEPT_URI,
                    sourceOntology: 'SRC',
                    conceptImportColumn: 'text1',
                    conceptLabelColumn: 'text2',
                },
                { name: 'text1Updated', rangeURI: TEXT_TYPE.rangeURI },
                { name: 'text2Updated', rangeURI: TEXT_TYPE.rangeURI },
            ],
        });
        testDomain = updateOntologyFieldProperties(0, 0, nameChangesDomain, origDomain, undefined);
        expect(testDomain.fields.get(0).sourceOntology).toBe('SRC');
        expect(testDomain.fields.get(0).conceptImportColumn).toBe('text1Updated');
        expect(testDomain.fields.get(0).conceptLabelColumn).toBe('text2Updated');

        const removedChangesDomain = DomainDesign.create({
            fields: [
                {
                    name: 'ont',
                    rangeURI: TEXT_TYPE.rangeURI,
                    conceptURI: CONCEPT_CODE_CONCEPT_URI,
                    sourceOntology: 'SRC',
                    conceptImportColumn: 'text1',
                    conceptLabelColumn: 'text2',
                },
                { name: 'text1', rangeURI: TEXT_TYPE.rangeURI },
            ],
        });
        const removedFieldIndexes = [{ originalIndex: 2, newIndex: undefined }];
        testDomain = updateOntologyFieldProperties(0, 0, removedChangesDomain, origDomain, removedFieldIndexes);
        expect(testDomain.fields.get(0).sourceOntology).toBe('SRC');
        expect(testDomain.fields.get(0).conceptImportColumn).toBe('text1');
        expect(testDomain.fields.get(0).conceptLabelColumn).toBe(undefined);

        const dataTypeChangesDomain = DomainDesign.create({
            fields: [
                {
                    name: 'ont',
                    rangeURI: TEXT_TYPE.rangeURI,
                    conceptURI: CONCEPT_CODE_CONCEPT_URI,
                    sourceOntology: 'SRC',
                    conceptImportColumn: 'text1',
                    conceptLabelColumn: 'text2',
                },
                { name: 'text1', rangeURI: INTEGER_TYPE.rangeURI },
                { name: 'text2', rangeURI: INTEGER_TYPE.rangeURI },
            ],
        });
        testDomain = updateOntologyFieldProperties(0, 0, dataTypeChangesDomain, origDomain, undefined);
        expect(testDomain.fields.get(0).sourceOntology).toBe('SRC');
        expect(testDomain.fields.get(0).conceptImportColumn).toBe(undefined);
        expect(testDomain.fields.get(0).conceptLabelColumn).toBe(undefined);
    });

    test('getOntologyUpdatedFieldName', () => {
        const origDomain = DomainDesign.create({
            fields: [
                { name: 'text', rangeURI: TEXT_TYPE.rangeURI },
                { name: 'int', rangeURI: INTEGER_TYPE.rangeURI },
            ],
        });
        const updatedDomain = DomainDesign.create({
            fields: [
                { name: 'textUpdated', rangeURI: TEXT_TYPE.rangeURI },
                { name: 'intUpdated', rangeURI: INTEGER_TYPE.rangeURI },
            ],
        });

        const removedFieldIndexes = [{ originalIndex: 0, newIndex: undefined }];
        expect(getOntologyUpdatedFieldName('text', origDomain, origDomain, undefined)).toStrictEqual([false, 'text']);
        expect(getOntologyUpdatedFieldName('text', updatedDomain, origDomain, undefined)).toStrictEqual([
            true,
            'textUpdated',
        ]);
        expect(getOntologyUpdatedFieldName('text', origDomain, origDomain, removedFieldIndexes)).toStrictEqual([
            true,
            undefined,
        ]);
        expect(getOntologyUpdatedFieldName('text', updatedDomain, origDomain, removedFieldIndexes)).toStrictEqual([
            true,
            undefined,
        ]);
        expect(getOntologyUpdatedFieldName('int', origDomain, origDomain, undefined)).toStrictEqual([false, undefined]);
        expect(getOntologyUpdatedFieldName('int', updatedDomain, origDomain, undefined)).toStrictEqual([
            true,
            undefined,
        ]);
    });

    test('downloadJsonFile', () => {
        const mockLink = { href: '', click: jest.fn(), download: '', style: { display: '' } } as any;
        const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValueOnce(mockLink);
        document.body.appendChild = jest.fn();
        document.body.removeChild = jest.fn();
        downloadJsonFile('test-file', 'fileName');

        expect(createElementSpy).toBeCalledWith('a');
        expect(mockLink.style.display).toBe('none');
        expect(document.body.appendChild).toBeCalledWith(mockLink);
        expect(mockLink.click).toBeCalled();
        expect(document.body.removeChild).toBeCalledWith(mockLink);
    });

    test('processJsonImport', () => {
        const domain = DomainDesign.create({});

        const emptinessError = {
            success: false,
            msg: 'No field definitions were found in the imported json file. Please check the file contents and try again.',
        };
        expect(processJsonImport('[]', domain)).toStrictEqual(emptinessError);
        expect(processJsonImport('{}', domain)).toStrictEqual(emptinessError);
        expect(processJsonImport('', domain)).toStrictEqual(emptinessError);
        expect(() => {
            processJsonImport('<<< Invalid JSON', domain);
        }).toThrow();

        const primaryKeyErrorAssay = {
            success: false,
            msg: "Error on importing field 'undefined': Assay domain type does not support fields with an externally defined Primary Key.",
        };
        const primaryKeyError = {
            success: false,
            msg: "Error on importing field 'undefined': This domain type does not support fields with an externally defined Primary Key.",
        };
        expect(
            processJsonImport(
                '[{"isPrimaryKey": true, "lockType": "PKLocked"}]',
                DomainDesign.create({ domainKindName: 'Assay' })
            )
        ).toStrictEqual(primaryKeyErrorAssay);
        expect(processJsonImport('[{"isPrimaryKey": true, "lockType": "PKLocked"}]', domain)).toStrictEqual(
            primaryKeyError
        );

        const jsonWithStrippableFields = '[{"propertyId": 1234, "propertyURI":1234}]';
        const result = processJsonImport(jsonWithStrippableFields, domain);
        expect(result.success).toBe(true);
        result.fields.forEach(field => {
            expect(field).not.toMatchObject({ propertyId: 'value', propertyURI: 'value' });
        });
    });

    // For more detail as to expected behavior of updateErrorIndexes, see comment above the function definition
    test('updateErrorIndexes', () => {
        const message = 'Generic error message';

        const initialErrors = [{ rowIndexes: [1] }, { rowIndexes: [4] }, { rowIndexes: [8] }];
        const initialRawModel = { exception: message, success: false, errors: initialErrors };
        const initialDomainException = DomainException.create(initialRawModel, SEVERITY_LEVEL_ERROR);

        const newErrors = [{ rowIndexes: [1] }, { rowIndexes: [3] }, { rowIndexes: [5] }];
        const newRawModel = { exception: message, success: false, errors: newErrors };
        const newDomainException = DomainException.create(newRawModel, SEVERITY_LEVEL_ERROR);

        expect(updateErrorIndexes([2, 5, 7], initialDomainException)).toEqual(newDomainException);
    });

    test('removeFields', () => {
        const message = 'Generic error message';
        const initialErrors = [{ rowIndexes: [1] }, { rowIndexes: [4] }, { rowIndexes: [8] }];
        const initialRawModel = { exception: message, success: false, errors: initialErrors };
        const initialDomainException = DomainException.create(initialRawModel, SEVERITY_LEVEL_ERROR);
        const initialDomain = DomainDesign.create({
            name: 'GenericList',
            domainException: initialDomainException,
            fields: [
                { name: 'zero' },
                { name: 'one' },
                { name: 'two' },
                { name: 'three' },
                { name: 'four' },
                { name: 'five' },
                { name: 'six' },
                { name: 'seven' },
                { name: 'eight' },
            ],
        });

        const newErrors = [{ rowIndexes: [1] }, { rowIndexes: [3] }, { rowIndexes: [5] }];
        const newRawModel = { exception: message, success: false, errors: newErrors };
        const newDomainException = DomainException.create(newRawModel, SEVERITY_LEVEL_ERROR);
        const newDomain = DomainDesign.create({
            name: 'GenericList',
            domainException: newDomainException,
            fields: [
                { name: 'zero' },
                { name: 'one' },
                { name: 'three' },
                { name: 'four' },
                { name: 'six' },
                { name: 'eight' },
            ],
        });

        expect(removeFields(initialDomain, [2, 5, 7])).toEqual(newDomain);
    });

    test('updateDataType clear ontology props on change', () => {
        let field = DomainField.create({
            sourceOntology: 'a',
            conceptSubtree: 'b',
            conceptLabelColumn: 'c',
            conceptImportColumn: 'd',
        });
        expect(field.dataType).toBe(TEXT_TYPE);
        expect(field.sourceOntology).toBe('a');
        expect(field.conceptSubtree).toBe('b');
        expect(field.conceptLabelColumn).toBe('c');
        expect(field.conceptImportColumn).toBe('d');

        field = updateDataType(field, 'boolean');
        expect(field.dataType).toBe(BOOLEAN_TYPE);
        expect(field.sourceOntology).toBeUndefined();
        expect(field.conceptSubtree).toBeUndefined();
        expect(field.conceptLabelColumn).toBeUndefined();
        expect(field.conceptImportColumn).toBeUndefined();
    });

    test('updateDataType clear textChoiceValidator props on change', () => {
        let field = DomainField.create({
            rangeURI: TEXT_CHOICE_TYPE.rangeURI,
            conceptURI: TEXT_CHOICE_TYPE.conceptURI,
            propertyValidators: [DEFAULT_TEXT_CHOICE_VALIDATOR.toJS()],
        });
        expect(field.dataType).toBe(TEXT_CHOICE_TYPE);
        expect(field.textChoiceValidator).toBeDefined();

        field = updateDataType(field, 'boolean');
        expect(field.dataType).toBe(BOOLEAN_TYPE);
        expect(field.textChoiceValidator).toBeUndefined();
    });

    test('updateDataType textChoice', () => {
        let field = DomainField.create({
            propertyValidators: [
                { type: 'Range', name: 'Range Validator', expression: '' },
                { type: 'RegEx', name: 'RegEx Validator', expression: '' },
                { type: 'Lookup', name: 'Lookup Validator', expression: '' },
            ],
            scale: 10,
        });
        expect(field.dataType).toBe(TEXT_TYPE);
        expect(field.scale).toBe(10);
        expect(field.lookupValidator).toBeDefined();
        expect(field.rangeValidators.size).toBe(1);
        expect(field.regexValidators.size).toBe(1);
        expect(field.textChoiceValidator).toBeUndefined();

        field = updateDataType(field, 'textChoice');
        expect(field.dataType).toBe(TEXT_CHOICE_TYPE);
        expect(field.scale).toBe(MAX_TEXT_LENGTH);
        expect(field.lookupValidator).toBeUndefined();
        expect(field.rangeValidators.size).toBe(0);
        expect(field.regexValidators.size).toBe(0);
        expect(field.textChoiceValidator).toBe(DEFAULT_TEXT_CHOICE_VALIDATOR);
    });

    test('updateDataType isLookup', () => {
        let field = DomainField.create({});
        expect(field.dataType).toBe(TEXT_TYPE);
        expect(field.lookupSchema).toBeUndefined();
        expect(field.lookupQuery).toBeUndefined();

        field = updateDataType(field, 'users');
        expect(field.dataType).toBe(USERS_TYPE);
        expect(field.lookupSchema).toBe('core');
        expect(field.lookupQuery).toBe('users');
    });

    test('updateDataType updateDefaultValues', () => {
        let field = DomainField.create({ measure: false, dimension: true });
        expect(field.dataType).toBe(TEXT_TYPE);
        expect(field.measure).toBe(false);
        expect(field.dimension).toBe(true);

        field = updateDataType(field, 'int');
        expect(field.dataType).toBe(INTEGER_TYPE);
        expect(field.measure).toBe(true);
        expect(field.dimension).toBe(false);
    });

    test('updateDataType Sample data type, new field', () => {
        let field = DomainField.create({});
        field = updateDataType(field, 'sample');
        expect(field.dataType).toBe(SAMPLE_TYPE);
        expect(field.lookupSchema).toBe('exp');
        expect(field.lookupQuery).toBe('Materials');
        expect(field.lookupQueryValue).toBe('http://www.w3.org/2001/XMLSchema#int|Materials');
    });

    test('updateDataType Sample data type, saved field', () => {
        let field = DomainField.create({ propertyId: 1 });
        field = updateDataType(field, 'sample');
        expect(field.dataType).toBe(SAMPLE_TYPE);
        expect(field.lookupSchema).toBe('exp');
        expect(field.lookupQuery).toBe('Materials');
        expect(field.lookupQueryValue).toBe('http://www.w3.org/2001/XMLSchema#int|Materials');
    });

    test('updateDataType Sample data type, saved lookup field', () => {
        let field = DomainField.create({ propertyId: 1, lookupSchema: 'exp', lookupQuery: 'Materials' });
        field = updateDataType(field, 'sample');
        expect(field.dataType).toBe(SAMPLE_TYPE);
        expect(field.lookupSchema).toBe('exp');
        expect(field.lookupQuery).toBe('Materials');
        expect(field.lookupQueryValue).toBe('http://www.w3.org/2001/XMLSchema#int|Materials');
    });

    test('updateDomainField principalConceptCode', () => {
        let domainDesign = DomainDesign.create({
            fields: [{ name: 'field1', principalConceptCode: undefined }],
        });
        expect(domainDesign.fields.get(0).principalConceptCode).toBeUndefined();

        domainDesign = updateDomainField(domainDesign, {
            id: createFormInputId(DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT, 0, 0),
            value: new ConceptModel({ code: 'test-code' }),
        } as IFieldChange);
        expect(domainDesign.fields.get(0).principalConceptCode).toBe('test-code');
    });

    // TODO more test cases for updateDomainField
});
