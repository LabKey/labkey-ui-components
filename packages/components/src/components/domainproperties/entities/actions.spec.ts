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
import { fromJS } from 'immutable';

import {
    getEntityDescriptionValue,
    getEntityNameExpressionValue,
    getEntityNameValue,
    getFormNameFromId,
    isEntityFormValid,
} from './actions';
import { ENTITY_FORM_ID_PREFIX } from './constants';
import { IEntityDetails } from './models';

describe('domainproperties entities actions', () => {
    test('getFormNameFromId', () => {
        expect(getFormNameFromId('test')).toBe('test');
        expect(getFormNameFromId(ENTITY_FORM_ID_PREFIX + 'test')).toBe('test');
        expect(getFormNameFromId('prefix-' + ENTITY_FORM_ID_PREFIX + 'test')).toBe(
            'prefix-' + ENTITY_FORM_ID_PREFIX + 'test'
        );
    });

    test('isEntityFormValid', () => {
        expect(isEntityFormValid(undefined, undefined)).toBeFalsy();

        expect(isEntityFormValid({} as IEntityDetails, undefined)).toBeFalsy();
        expect(isEntityFormValid({ 'entity-name': '' } as IEntityDetails, undefined)).toBeFalsy();
        expect(isEntityFormValid({ 'entity-name': 'test' } as IEntityDetails, undefined)).toBeTruthy();

        expect(isEntityFormValid(undefined, fromJS({}))).toBeFalsy();
        expect(isEntityFormValid(undefined, fromJS({ rowId: 0 }))).toBeFalsy();
        expect(isEntityFormValid(undefined, fromJS({ rowId: 1 }))).toBeTruthy();
    });

    test('getEntityNameValue', () => {
        expect(getEntityNameValue(undefined, undefined)).toBe('');
        expect(getEntityNameValue({} as IEntityDetails, undefined)).toBe('');
        expect(getEntityNameValue(undefined, fromJS({}))).toBe('');
        expect(getEntityNameValue({ name: 'test1' } as IEntityDetails, undefined)).toBe('');
        expect(getEntityNameValue({ 'entity-name': 'test1' } as IEntityDetails, undefined)).toBe('test1');
        expect(getEntityNameValue(undefined, fromJS({ name: 'test2' }))).toBe('test2');
        expect(getEntityNameValue({ 'entity-name': 'test1' } as IEntityDetails, fromJS({ name: 'test2' }))).toBe(
            'test1'
        );
    });

    test('getEntityDescriptionValue', () => {
        expect(getEntityDescriptionValue(undefined, undefined)).toBe('');
        expect(getEntityDescriptionValue({} as IEntityDetails, undefined)).toBe('');
        expect(getEntityDescriptionValue(undefined, fromJS({}))).toBe('');
        expect(getEntityDescriptionValue({ description: 'test1' } as IEntityDetails, undefined)).toBe('');
        expect(getEntityDescriptionValue({ 'entity-description': 'test1' } as IEntityDetails, undefined)).toBe('test1');
        expect(getEntityDescriptionValue(undefined, fromJS({ description: 'test2' }))).toBe('test2');
        expect(
            getEntityDescriptionValue(
                { 'entity-description': 'test1' } as IEntityDetails,
                fromJS({ description: 'test2' })
            )
        ).toBe('test1');
    });

    test('getEntityNameExpressionValue', () => {
        expect(getEntityNameExpressionValue(undefined, undefined)).toBe('');
        expect(getEntityNameExpressionValue({} as IEntityDetails, undefined)).toBe('');
        expect(getEntityNameExpressionValue(undefined, fromJS({}))).toBe('');
        expect(getEntityNameExpressionValue({ nameExpression: 'test1' } as IEntityDetails, undefined)).toBe('');
        expect(getEntityNameExpressionValue({ 'entity-nameExpression': 'test1' } as IEntityDetails, undefined)).toBe(
            'test1'
        );
        expect(getEntityNameExpressionValue(undefined, fromJS({ nameExpression: 'test2' }))).toBe('test2');
        expect(
            getEntityNameExpressionValue(
                { 'entity-nameExpression': 'test1' } as IEntityDetails,
                fromJS({ nameExpression: 'test2' })
            )
        ).toBe('test1');
    });
});
