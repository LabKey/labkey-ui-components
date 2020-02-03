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
import {
    AssayProtocolModel,
    ATTACHMENT_TYPE,
    BOOLEAN_TYPE,
    DATETIME_TYPE,
    DomainDesign,
    DomainField,
    DOUBLE_TYPE,
    FILE_TYPE,
    FLAG_TYPE,
    INTEGER_TYPE,
    LOOKUP_TYPE,
    MULTILINE_TYPE,
    PARTICIPANT_TYPE,
    PropDescType,
    SAMPLE_TYPE,
    TEXT_TYPE,
    USERS_TYPE,
} from './models';
import { DOMAIN_FIELD_NOT_LOCKED, DOMAIN_FIELD_PARTIALLY_LOCKED } from './constants';

describe('PropDescType', () => {
    test("isInteger", () => {
        expect(PropDescType.isInteger(TEXT_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(LOOKUP_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(MULTILINE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(BOOLEAN_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(INTEGER_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isInteger(DOUBLE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(DATETIME_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(FLAG_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(FILE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(ATTACHMENT_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isInteger(USERS_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isInteger(SAMPLE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isInteger(PARTICIPANT_TYPE.rangeURI)).toBeFalsy();
    });

    test("isString", () => {
        expect(PropDescType.isString(TEXT_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isString(LOOKUP_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(MULTILINE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isString(BOOLEAN_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(INTEGER_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(DOUBLE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(DATETIME_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(FLAG_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isString(FILE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(ATTACHMENT_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(USERS_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(SAMPLE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isString(PARTICIPANT_TYPE.rangeURI)).toBeTruthy();
    });

    test("isMeasure", () => {
        expect(PropDescType.isMeasure(TEXT_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(LOOKUP_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(MULTILINE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(BOOLEAN_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(INTEGER_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(DOUBLE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(DATETIME_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(FLAG_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(FILE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isMeasure(ATTACHMENT_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isMeasure(USERS_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(SAMPLE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMeasure(PARTICIPANT_TYPE.rangeURI)).toBeTruthy();
    });

    test("isDimension", () => {
        expect(PropDescType.isDimension(TEXT_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isDimension(LOOKUP_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isDimension(MULTILINE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isDimension(BOOLEAN_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isDimension(INTEGER_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isDimension(DOUBLE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isDimension(DATETIME_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isDimension(FLAG_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isDimension(FILE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isDimension(ATTACHMENT_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isDimension(USERS_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isDimension(SAMPLE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isDimension(PARTICIPANT_TYPE.rangeURI)).toBeTruthy();
    });

    test("isMvEnableable", () => {
        expect(PropDescType.isMvEnableable(TEXT_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(LOOKUP_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(MULTILINE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isMvEnableable(BOOLEAN_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(INTEGER_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(DOUBLE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(DATETIME_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(FLAG_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(FILE_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isMvEnableable(ATTACHMENT_TYPE.rangeURI)).toBeFalsy();
        expect(PropDescType.isMvEnableable(USERS_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(SAMPLE_TYPE.rangeURI)).toBeTruthy();
        expect(PropDescType.isMvEnableable(PARTICIPANT_TYPE.rangeURI)).toBeTruthy();
    });
});

describe('DomainDesign', () => {
    test("isNameSuffixMatch", () => {
        const d = DomainDesign.create({name: 'Foo Fields'});
        expect(d.isNameSuffixMatch('Foo')).toBeTruthy();
        expect(d.isNameSuffixMatch('foo')).toBeFalsy();
        expect(d.isNameSuffixMatch('Bar')).toBeFalsy();
        expect(d.isNameSuffixMatch('bar')).toBeFalsy();
    });

    test("mandatoryFieldNames", () => {
        const base = {name: 'Test Fields', fields: [{name: 'abc'},{name: 'def'}]};

        let domain = DomainDesign.create({...base, mandatoryFieldNames: undefined});
        expect(domain.fields.size).toBe(2);
        expect(domain.fields.get(0).lockType).toBe(DOMAIN_FIELD_NOT_LOCKED);
        expect(domain.fields.get(1).lockType).toBe(DOMAIN_FIELD_NOT_LOCKED);

        domain = DomainDesign.create({...base, mandatoryFieldNames: ['abc', 'DEF']});
        expect(domain.fields.size).toBe(2);
        expect(domain.fields.get(0).lockType).toBe(DOMAIN_FIELD_PARTIALLY_LOCKED);
        expect(domain.fields.get(1).lockType).toBe(DOMAIN_FIELD_PARTIALLY_LOCKED);
    });
});

describe('DomainField', () => {
    test("isNew", () => {
        const f1 = DomainField.create({name: 'foo', rangeURI: TEXT_TYPE.rangeURI});
        expect(f1.isNew()).toBeTruthy();
        const f2 = DomainField.create({name: 'foo', rangeURI: TEXT_TYPE.rangeURI, propertyId: 0});
        expect(f2.isNew()).toBeFalsy();
    });

    test("isSaved", () => {
        const f1 = DomainField.create({name: 'foo', rangeURI: TEXT_TYPE.rangeURI});
        expect(f1.isSaved()).toBeFalsy();
        const f2 = DomainField.create({name: 'foo', rangeURI: TEXT_TYPE.rangeURI, propertyId: 0});
        expect(f2.isSaved()).toBeFalsy();
        const f3 = DomainField.create({name: 'foo', rangeURI: TEXT_TYPE.rangeURI, propertyId: 1});
        expect(f3.isSaved()).toBeTruthy();
    });

    test("updateDefaultValues", () => {
        const textField = DomainField.create({name: 'foo', rangeURI: TEXT_TYPE.rangeURI});
        expect(textField.measure).toBeFalsy();
        expect(textField.dimension).toBeFalsy();
        const updatedTextField = DomainField.updateDefaultValues(textField);
        expect(updatedTextField.measure).toBeFalsy();
        expect(updatedTextField.dimension).toBeFalsy();

        const intField = DomainField.create({name: 'foo', rangeURI: INTEGER_TYPE.rangeURI});
        expect(intField.measure).toBeFalsy();
        expect(intField.dimension).toBeFalsy();
        const updatedIntField = DomainField.updateDefaultValues(intField);
        expect(updatedIntField.measure).toBeTruthy();
        expect(updatedIntField.dimension).toBeFalsy();

        const dblField = DomainField.create({name: 'foo', rangeURI: INTEGER_TYPE.rangeURI});
        expect(dblField.measure).toBeFalsy();
        expect(dblField.dimension).toBeFalsy();
        const updatedDblField = DomainField.updateDefaultValues(dblField);
        expect(updatedDblField.measure).toBeTruthy();
        expect(updatedDblField.dimension).toBeFalsy();
    });
});

describe('AssayProtocolModel', () => {
    test("getDomainByNameSuffix", () => {
        const model = AssayProtocolModel.create({
            protocolId: 1,
            name: 'Test Assay Protocol',
            description: 'My assay protocol for you all to use.',
            domains: [{
                name: 'Sample Fields',
                fields: [{
                    name: 'field1',
                    rangeURI: 'xsd:string'
                },{
                    name: 'field2',
                    rangeURI: 'xsd:int'
                },{
                    name: 'field3',
                    rangeURI: 'xsd:dateTime'
                }]
            }]
        });

        expect(model.getDomainByNameSuffix('Foo') === undefined).toBeTruthy();
        expect(model.getDomainByNameSuffix('sample') === undefined).toBeTruthy();
        expect(model.getDomainByNameSuffix('Sample') === undefined).toBeFalsy();
    });

    test("isNew", () => {
        // name should get removed for the case where it is a "new" model (i.e. doesn't have a protocolId)
        expect(AssayProtocolModel.create({protocolId: 1, name: 'Test'}).isNew()).toBeFalsy();
        expect(AssayProtocolModel.create({protocolId: 0, name: 'Test'}).isNew()).toBeTruthy();
        expect(AssayProtocolModel.create({name: 'Test'}).isNew()).toBeTruthy();
    });

    test("name removal for copy case", () => {
        // name should get removed for the case where it is a "new" model (i.e. doesn't have a protocolId)
        expect(AssayProtocolModel.create({protocolId: 1, name: 'Test'}).name).toBe('Test');
        expect(AssayProtocolModel.create({protocolId: 0, name: 'Test'}).name).toBe(undefined);
        expect(AssayProtocolModel.create({name: 'Test'}).name).toBe(undefined);
    });

    test("allowPlateTemplateSelection", () => {
        expect(AssayProtocolModel.create({}).allowPlateTemplateSelection()).toBeFalsy();
        expect(AssayProtocolModel.create({availablePlateTemplates: 'test'}).allowPlateTemplateSelection()).toBeFalsy();
        expect(AssayProtocolModel.create({availablePlateTemplates: []}).allowPlateTemplateSelection()).toBeTruthy();
        expect(AssayProtocolModel.create({availablePlateTemplates: ['a', 'b', 'c']}).allowPlateTemplateSelection()).toBeTruthy();
    });

    test("allowDetectionMethodSelection", () => {
        expect(AssayProtocolModel.create({}).allowDetectionMethodSelection()).toBeFalsy();
        expect(AssayProtocolModel.create({availableDetectionMethods: 'test'}).allowDetectionMethodSelection()).toBeFalsy();
        expect(AssayProtocolModel.create({availableDetectionMethods: []}).allowDetectionMethodSelection()).toBeTruthy();
        expect(AssayProtocolModel.create({availableDetectionMethods: ['a', 'b', 'c']}).allowDetectionMethodSelection()).toBeTruthy();
    });

    test("allowMetadataInputFormatSelection", () => {
        expect(AssayProtocolModel.create({}).allowMetadataInputFormatSelection()).toBeFalsy();
        expect(AssayProtocolModel.create({availableMetadataInputFormats: 'test'}).allowMetadataInputFormatSelection()).toBeFalsy();
        expect(AssayProtocolModel.create({availableMetadataInputFormats: {}}).allowMetadataInputFormatSelection()).toBeFalsy();
        expect(AssayProtocolModel.create({availableMetadataInputFormats: {test1: 'abc', test2: 'def'}}).allowMetadataInputFormatSelection()).toBeTruthy();
    });

    test("isValid", () => {
        const base = {protocolId: 1, name: 'test'};

        expect(AssayProtocolModel.create({...base, name: undefined}).hasValidProperties()).toBeFalsy();
        expect(AssayProtocolModel.create({...base, name: null}).hasValidProperties()).toBeFalsy();
        expect(AssayProtocolModel.create({...base, name: ''}).hasValidProperties()).toBeFalsy();
        expect(AssayProtocolModel.create({...base, name: 'test'}).hasValidProperties()).toBeTruthy();

        expect(AssayProtocolModel.create({...base, availableMetadataInputFormats: {foo: 'bar'}, selectedMetadataInputFormat: undefined}).hasValidProperties()).toBeFalsy();
        expect(AssayProtocolModel.create({...base, availableMetadataInputFormats: {foo: 'bar'}, selectedMetadataInputFormat: null}).hasValidProperties()).toBeFalsy();
        expect(AssayProtocolModel.create({...base, availableMetadataInputFormats: {foo: 'bar'}, selectedMetadataInputFormat: 1}).hasValidProperties()).toBeFalsy();
        expect(AssayProtocolModel.create({...base, availableMetadataInputFormats: {foo: 'bar'}, selectedMetadataInputFormat: 'foo'}).hasValidProperties()).toBeTruthy();

        expect(AssayProtocolModel.create({...base, availableDetectionMethods: ['foo'], selectedDetectionMethod: undefined}).hasValidProperties()).toBeFalsy();
        expect(AssayProtocolModel.create({...base, availableDetectionMethods: ['foo'], selectedDetectionMethod: null}).hasValidProperties()).toBeFalsy();
        expect(AssayProtocolModel.create({...base, availableDetectionMethods: ['foo'], selectedDetectionMethod: 1}).hasValidProperties()).toBeFalsy();
        expect(AssayProtocolModel.create({...base, availableDetectionMethods: ['foo'], selectedDetectionMethod: 'foo'}).hasValidProperties()).toBeTruthy();

        expect(AssayProtocolModel.create({...base, availablePlateTemplates: ['foo'], selectedPlateTemplate: undefined}).hasValidProperties()).toBeFalsy();
        expect(AssayProtocolModel.create({...base, availablePlateTemplates: ['foo'], selectedPlateTemplate: null}).hasValidProperties()).toBeFalsy();
        expect(AssayProtocolModel.create({...base, availablePlateTemplates: ['foo'], selectedPlateTemplate: 1}).hasValidProperties()).toBeFalsy();
        expect(AssayProtocolModel.create({...base, availablePlateTemplates: ['foo'], selectedPlateTemplate: 'foo'}).hasValidProperties()).toBeTruthy();
    });

    test("validateTransformScripts", () => {
        const base = {protocolId: 1, name: 'test'};

        expect(AssayProtocolModel.create({...base}).validateTransformScripts()).toBe(undefined);
        expect(AssayProtocolModel.create({...base, protocolTransformScripts: []}).validateTransformScripts()).toBe(undefined);
        expect(AssayProtocolModel.create({...base, protocolTransformScripts: List<string>()}).validateTransformScripts()).toBe(undefined);
        expect(AssayProtocolModel.create({...base, protocolTransformScripts: ['foo.pl', 'bar.R']}).validateTransformScripts()).toBe(undefined);

        expect(AssayProtocolModel.create({...base, protocolTransformScripts: ['foo.pl', 'bar.R', '']}).validateTransformScripts()).toContain('Missing required');
        expect(AssayProtocolModel.create({...base, protocolTransformScripts: ['foo.pl', null, 'bar.R']}).validateTransformScripts()).toContain('Missing required');
        expect(AssayProtocolModel.create({...base, protocolTransformScripts: [undefined, 'foo.pl', 'bar.R']}).validateTransformScripts()).toContain('Missing required');

        expect(AssayProtocolModel.create({...base, allowSpacesInPath: true, saveScriptFiles: false, protocolTransformScripts: ['foo.pl', 'bar.R']}).validateTransformScripts()).toBe(undefined);
        expect(AssayProtocolModel.create({...base, allowSpacesInPath: true, saveScriptFiles: true, protocolTransformScripts: ['foo.pl', 'bar.R']}).validateTransformScripts()).toBe(undefined);
        expect(AssayProtocolModel.create({...base, allowSpacesInPath: true, saveScriptFiles: false, protocolTransformScripts: ['foo.pl', '/path with space/bar.R']}).validateTransformScripts()).toBe(undefined);
        expect(AssayProtocolModel.create({...base, allowSpacesInPath: true, saveScriptFiles: true, protocolTransformScripts: ['foo.pl', '/path with space/bar.R']}).validateTransformScripts()).toBe(undefined);
        expect(AssayProtocolModel.create({...base, allowSpacesInPath: false, saveScriptFiles: false, protocolTransformScripts: ['foo.pl', 'bar.R']}).validateTransformScripts()).toBe(undefined);
        expect(AssayProtocolModel.create({...base, allowSpacesInPath: false, saveScriptFiles: true, protocolTransformScripts: ['foo.pl', 'bar.R']}).validateTransformScripts()).toBe(undefined);
        expect(AssayProtocolModel.create({...base, allowSpacesInPath: false, saveScriptFiles: false, protocolTransformScripts: ['foo.pl', '/path with space/bar.R']}).validateTransformScripts()).toBe(undefined);
        expect(AssayProtocolModel.create({...base, allowSpacesInPath: false, saveScriptFiles: true, protocolTransformScripts: ['foo.pl', '/path with space/bar.R']}).validateTransformScripts()).toContain('should not contain spaces');
    });
});
