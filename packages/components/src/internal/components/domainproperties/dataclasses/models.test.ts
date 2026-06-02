/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { DomainDesign } from '../models';

import { DataClassModel } from './models';
import { DATACLASS_DOMAIN_SYSTEM_FIELDS } from './constants';

describe('DataClassModel', () => {
    test('isNew', () => {
        expect(DataClassModel.create({ rowId: undefined }).isNew).toBeTruthy();
        expect(DataClassModel.create({ rowId: 0 }).isNew).toBeTruthy();
        expect(DataClassModel.create({ rowId: 1 }).isNew).toBeFalsy();
    });

    test('hasValidProperties', () => {
        expect(DataClassModel.create({ name: undefined }).hasValidProperties).toBeFalsy();
        expect(DataClassModel.create({ name: null }).hasValidProperties).toBeFalsy();
        expect(DataClassModel.create({ name: '' }).hasValidProperties).toBeFalsy();
        expect(DataClassModel.create({ name: ' ' }).hasValidProperties).toBeFalsy();
        expect(DataClassModel.create({ name: 'test' }).hasValidProperties).toBeTruthy();
    });

    test('isValid', () => {
        expect(DataClassModel.create({ name: 'test' }).isValid()).toBeTruthy();
        expect(DataClassModel.create({ name: '' }).isValid()).toBeFalsy();

        const invalidModel = DataClassModel.create({
            name: 'test',
            domainDesign: { fields: [{ name: '' }] },
        });
        expect(invalidModel.isValid()).toBeFalsy();
    });

    test('getOptions', () => {
        const model = DataClassModel.create({
            rowId: 1,
            exception: 'exception',
            name: 'name',
            nameExpression: 'nameExpression',
            description: 'description',
            sampleSet: 2,
            category: 'category',
            domain: DomainDesign.create({}),
        });

        expect(model.options['exception']).toBeUndefined();
        expect(model.options['domain']).toBeUndefined();
        expect(model.options.rowId).toBe(1);
        expect(model.options.name).toBe('name');
        expect(model.options.nameExpression).toBe('nameExpression');
        expect(model.options.description).toBe('description');
        expect(model.options.sampleSet).toBe(2);
        expect(model.options.category).toBe('category');
        expect(model.options.systemFields).toBe(DATACLASS_DOMAIN_SYSTEM_FIELDS);
    });
});
