/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { produce } from 'immer';

import getDomainDetailsJSON from '../../../../test/data/issuesListDef-getDomainDetails.json';

import { DomainDesign, DomainField } from '../models';

import { IssuesListDefModel } from './models';

describe('IssuesListDefModel', () => {
    test('isNew', () => {
        const newModel = IssuesListDefModel.create(null, { name: 'Issues List For Model jest' });
        expect(newModel.isNew()).toBeTruthy();
    });

    test('hasValidProperties', () => {
        expect(IssuesListDefModel.create({ options: { issueDefName: undefined } }).hasValidProperties()).toBeFalsy();
        expect(IssuesListDefModel.create({ options: { issueDefName: null } }).hasValidProperties()).toBeFalsy();
        expect(IssuesListDefModel.create({ options: { issueDefName: '' } }).hasValidProperties()).toBeFalsy();
        expect(IssuesListDefModel.create({ options: { issueDefName: ' ' } }).hasValidProperties()).toBeFalsy();
        expect(IssuesListDefModel.create({ options: { issueDefName: 'test' } }).hasValidProperties()).toBeTruthy();
    });

    test('isValid', () => {
        const validModel = IssuesListDefModel.create(getDomainDetailsJSON);
        expect(validModel.isValid()).toBeTruthy();

        let invalidModel = produce(validModel, draft => {
            draft.issueDefName = undefined;
        });
        expect(invalidModel.isValid()).toBeFalsy();
        invalidModel = produce(validModel, draft => {
            draft.domain = validModel.domain.merge({
                fields: validModel.domain.fields.push(DomainField.create({})),
            }) as DomainDesign;
        });
        expect(invalidModel.isValid()).toBeFalsy();
    });

    test('getOptions', () => {
        const existingModel = IssuesListDefModel.create(getDomainDetailsJSON);
        const options = existingModel.getOptions();
        expect(options).not.toHaveProperty('exception');
        expect(options).not.toHaveProperty('domain');
        expect(options).toHaveProperty('issueDefName');
    });
});
