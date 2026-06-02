/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
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
