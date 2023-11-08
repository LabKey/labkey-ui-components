/*
 * Copyright (c) 2020 LabKey Corporation
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
