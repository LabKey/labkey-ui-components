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

import { QueryColumn } from '../../..';

import {
    createFormInputId,
    getBannerMessages,
    getDomainAlertClasses,
    getDomainBottomErrorMessage,
    getDomainHeaderName,
    getDomainPanelClass,
    getDomainPanelHeaderId,
    getDomainPanelStatus,
    setDomainFields,
    updateDomainException,
} from './actions';
import {
    DomainDesign,
    DomainException,
    DomainField,
} from './models';
import {
    DATETIME_TYPE,
    DOUBLE_TYPE,
    INTEGER_TYPE,
    TEXT_TYPE,
} from './PropDescType';
import {
    DOMAIN_FIELD_PREFIX,
    FIELD_NAME_CHAR_WARNING_INFO,
    FIELD_NAME_CHAR_WARNING_MSG,
    FLAG_CONCEPT_URI,
    INT_RANGE_URI,
    SEVERITY_LEVEL_ERROR,
    SEVERITY_LEVEL_WARN,
    STRING_RANGE_URI,
} from './constants';

describe('domain properties actions', () => {
    test('test create id', () => {
        return expect(createFormInputId('marty', 0, 100)).toBe(DOMAIN_FIELD_PREFIX + '-marty-0-100');
    });

    test('test get field type', () => {
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
            QueryColumn.create({ name: 'text', rangeURI: TEXT_TYPE.rangeURI }),
            QueryColumn.create({ name: 'dbl', rangeURI: DOUBLE_TYPE.rangeURI }),
            QueryColumn.create({ name: 'dt', rangeURI: DATETIME_TYPE.rangeURI }),
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
        expect(getDomainPanelClass(true, true, true)).toBe('domain-form-panel');
        expect(getDomainPanelClass(true, true, false)).toBe('domain-form-panel');
        expect(getDomainPanelClass(true, false, true)).toBe('domain-form-panel');
        expect(getDomainPanelClass(true, false, false)).toBe('domain-form-panel');
        expect(getDomainPanelClass(false, true, true)).toBe('domain-form-panel lk-border-theme-light');
        expect(getDomainPanelClass(false, true, false)).toBe('domain-form-panel domain-panel-no-theme');
        expect(getDomainPanelClass(false, false, true)).toBe('domain-form-panel');
        expect(getDomainPanelClass(false, false, false)).toBe('domain-form-panel');
    });

    test('getDomainAlertClasses', () => {
        expect(getDomainAlertClasses(true, true, true)).toBe('domain-bottom-alert panel-default');
        expect(getDomainAlertClasses(true, false, true)).toBe('domain-bottom-alert panel-default');
        expect(getDomainAlertClasses(true, true, false)).toBe('domain-bottom-alert panel-default');
        expect(getDomainAlertClasses(true, false, false)).toBe('domain-bottom-alert panel-default');
        expect(getDomainAlertClasses(false, true, true)).toBe(
            'domain-bottom-alert panel-default lk-border-theme-light domain-bottom-alert-top'
        );
        expect(getDomainAlertClasses(false, true, false)).toBe(
            'domain-bottom-alert panel-default domain-bottom-alert-expanded domain-bottom-alert-top'
        );
        expect(getDomainAlertClasses(false, false, true)).toBe(
            'domain-bottom-alert panel-default domain-bottom-alert-top'
        );
        expect(getDomainAlertClasses(false, false, false)).toBe(
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
});
