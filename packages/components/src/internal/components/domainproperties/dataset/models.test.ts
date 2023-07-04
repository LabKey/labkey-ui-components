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
import { BOOLEAN_TYPE, DATETIME_TYPE, DECIMAL_TYPE, FILE_TYPE, INTEGER_TYPE, TEXT_TYPE } from '../PropDescType';

import { DatasetModel } from './models';

describe('DatasetModel', () => {
    test('isNew', () => {
        expect(DatasetModel.create({ entityId: undefined }).isNew()).toBeTruthy();
        expect(DatasetModel.create({ entityId: 0 }).isNew()).toBeTruthy();
        expect(DatasetModel.create({ entityId: 1 }).isNew()).toBeFalsy();
    });

    test('hasValidProperties name', () => {
        expect(DatasetModel.create({ name: undefined }).hasValidProperties()).toBeFalsy();
        expect(DatasetModel.create({ name: null }).hasValidProperties()).toBeFalsy();
        expect(DatasetModel.create({ name: '' }).hasValidProperties()).toBeFalsy();
        expect(DatasetModel.create({ name: ' ' }).hasValidProperties()).toBeFalsy();
        expect(DatasetModel.create({ name: 'test' }).hasValidProperties()).toBeTruthy();
    });

    test('hasValidProperties label', () => {
        expect(DatasetModel.create({ name: 'test', label: undefined }).hasValidProperties()).toBeTruthy();
        expect(DatasetModel.create({ name: 'test', label: undefined, entityId: 1 }).hasValidProperties()).toBeFalsy();
        expect(DatasetModel.create({ name: 'test', label: null, entityId: 1 }).hasValidProperties()).toBeFalsy();
        expect(DatasetModel.create({ name: 'test', label: '', entityId: 1 }).hasValidProperties()).toBeFalsy();
        expect(DatasetModel.create({ name: 'test', label: ' ', entityId: 1 }).hasValidProperties()).toBeFalsy();
        expect(DatasetModel.create({ name: 'test', label: 'test label' }).hasValidProperties()).toBeTruthy();
    });

    test('hasValidProperties dataRowSetting', () => {
        expect(
            DatasetModel.create({
                name: 'test',
                demographicData: true,
                keyPropertyName: undefined,
                useTimeKeyField: false,
            }).hasValidProperties()
        ).toBeTruthy();
        expect(
            DatasetModel.create({
                name: 'test',
                demographicData: false,
                keyPropertyName: undefined,
                useTimeKeyField: false,
            }).hasValidProperties()
        ).toBeTruthy();
        expect(
            DatasetModel.create({
                name: 'test',
                demographicData: false,
                keyPropertyName: undefined,
                useTimeKeyField: true,
            }).hasValidProperties()
        ).toBeTruthy();
        expect(
            DatasetModel.create({
                name: 'test',
                demographicData: false,
                keyPropertyName: 'test',
                useTimeKeyField: true,
            }).hasValidProperties()
        ).toBeTruthy();
        expect(
            DatasetModel.create({
                name: 'test',
                demographicData: false,
                keyPropertyName: null,
                useTimeKeyField: false,
            }).hasValidProperties()
        ).toBeTruthy();
        expect(
            DatasetModel.create({
                name: 'test',
                demographicData: false,
                keyPropertyName: '',
                useTimeKeyField: false,
            }).hasValidProperties()
        ).toBeFalsy();
        expect(
            DatasetModel.create({
                name: 'test',
                demographicData: false,
                keyPropertyName: 'test',
                useTimeKeyField: false,
            }).hasValidProperties()
        ).toBeTruthy();
    });

    test('dataRowSetting', () => {
        expect(
            DatasetModel.create({
                name: 'test',
                demographicData: true,
                keyPropertyName: undefined,
                useTimeKeyField: false,
            }).getDataRowSetting()
        ).toBe(0);
        expect(
            DatasetModel.create({
                name: 'test',
                demographicData: true,
                keyPropertyName: undefined,
                useTimeKeyField: true,
            }).getDataRowSetting()
        ).toBe(0);
        expect(
            DatasetModel.create({
                name: 'test',
                demographicData: false,
                keyPropertyName: undefined,
                useTimeKeyField: false,
            }).getDataRowSetting()
        ).toBe(1);
        expect(
            DatasetModel.create({
                name: 'test',
                demographicData: false,
                keyPropertyName: null,
                useTimeKeyField: false,
            }).getDataRowSetting()
        ).toBe(1);
        expect(
            DatasetModel.create({
                name: 'test',
                demographicData: false,
                keyPropertyName: null,
                useTimeKeyField: true,
            }).getDataRowSetting()
        ).toBe(2);
        expect(
            DatasetModel.create({
                name: 'test',
                demographicData: false,
                keyPropertyName: 'test',
                useTimeKeyField: false,
            }).getDataRowSetting()
        ).toBe(2);
    });

    test('validManagedKeyField', () => {
        const model = DatasetModel.create(null, {
            options: { name: 'test' },
            domainDesign: {
                fields: [
                    { name: 'text', rangeURI: TEXT_TYPE.rangeURI },
                    { name: 'int', rangeURI: INTEGER_TYPE.rangeURI },
                    { name: 'decimal', rangeURI: DECIMAL_TYPE.rangeURI },
                    { name: 'boolean', rangeURI: BOOLEAN_TYPE.rangeURI },
                    { name: 'date', rangeURI: DATETIME_TYPE.rangeURI },
                    { name: 'file', rangeURI: FILE_TYPE.rangeURI },
                ],
            },
        });

        expect(model.domain.fields.size).toBe(6);
        expect(model.validManagedKeyField()).toBeFalsy();
        expect(model.validManagedKeyField('text')).toBeTruthy();
        expect(model.validManagedKeyField('int')).toBeTruthy();
        expect(model.validManagedKeyField('decimal')).toBeTruthy();
        expect(model.validManagedKeyField('boolean')).toBeFalsy();
        expect(model.validManagedKeyField('date')).toBeFalsy();
        expect(model.validManagedKeyField('file')).toBeFalsy();
    });

    test('isValid', () => {
        const validModel = DatasetModel.create(null, { options: { name: 'test' } });
        expect(validModel.isValid()).toBeTruthy();

        let invalidModel = DatasetModel.create(null, { options: { name: '' } });
        expect(invalidModel.isValid()).toBeFalsy();

        invalidModel = DatasetModel.create(null, {
            options: { name: 'test' },
            domainDesign: {
                fields: [{ name: '', rangeURI: TEXT_TYPE.rangeURI }],
            },
        });
        expect(invalidModel.isValid()).toBeFalsy();
    });

    test('getDomainKind', () => {
        // this is based on the setting in the package.json jest "timepointType"
        expect(DatasetModel.create({ name: 'test' }).getDomainKind()).toBe('StudyDatasetVisit');
    });

    test('isFromLinkedSource', () => {
        expect(DatasetModel.create({ name: 'test' }).isFromLinkedSource()).toBeFalsy();
        expect(DatasetModel.create({ name: 'test', sourceName: undefined }).isFromLinkedSource()).toBeFalsy();
        expect(DatasetModel.create({ name: 'test', sourceName: null }).isFromLinkedSource()).toBeFalsy();
        expect(DatasetModel.create({ name: 'test', sourceName: 'test' }).isFromLinkedSource()).toBeTruthy();
    });
});
