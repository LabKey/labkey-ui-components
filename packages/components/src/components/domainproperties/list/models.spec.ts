import { DEFAULT_LIST_SETTINGS } from '../../../test/data/constants';
import getDomainDetailsJSON from '../../../test/data/list-getDomainDetails.json';

import { ListModel } from './models';

// Minimal domain object mock
const domainDesign = { fields: [{ name: 'PK', isPrimaryKey: true }] };

describe('ListModel', () => {
    test('new model', () => {
        const newModel = ListModel.create(null, DEFAULT_LIST_SETTINGS);

        expect(newModel.getIn(['domain', 'name'])).toEqual(undefined);
        expect(newModel.getIn(['domain', 'domainId'])).toEqual(null);
        expect(newModel.getIn(['name'])).toEqual(null);
        expect(newModel.getIn(['keyType'])).toEqual(null);

        expect(newModel.isNew()).toBeTruthy();
    });

    test('existing model', () => {
        const existingModel = ListModel.create(getDomainDetailsJSON);

        expect(existingModel.getIn(['domain', 'name'])).toEqual('NIMHDemographics');
        expect(existingModel.getIn(['domain', 'domainId'])).toEqual(2280);
        expect(existingModel.getIn(['name'])).toEqual('NIMHDemographics');
        expect(existingModel.getIn(['keyType'])).toEqual('Integer');
        expect(existingModel.getIn(['keyName'])).toEqual('SubjectID');

        expect(existingModel.isNew()).toBeFalsy();
    });

    test('isValid', () => {
        const validModel = ListModel.create(getDomainDetailsJSON);
        expect(ListModel.isValid(validModel)).toBeTruthy();
    });

    test('hasValidProperties', () => {
        expect(ListModel.create({ options: { name: undefined }, domainDesign }).hasValidProperties()).toBeFalsy();
        expect(ListModel.create({ options: { name: null }, domainDesign }).hasValidProperties()).toBeFalsy();
        expect(ListModel.create({ options: { name: '' }, domainDesign }).hasValidProperties()).toBeFalsy();
        expect(ListModel.create({ options: { name: ' ' }, domainDesign }).hasValidProperties()).toBeFalsy();
        expect(ListModel.create({ options: { name: 'test' }, domainDesign }).hasValidProperties()).toBeTruthy();
    });

    test('hasValidKeyType', () => {
        expect(ListModel.create({ options: { keyType: undefined }, domainDesign }).hasValidKeyType()).toBeFalsy();
        expect(ListModel.create({ options: { keyType: 'Varchar' }, domainDesign }).hasValidKeyType()).toBeTruthy();
    });

    test('getDomainKind', () => {
        expect(ListModel.create({ options: { keyType: 'Varchar' }, domainDesign }).getDomainKind()).toEqual('VarList');
        expect(ListModel.create({ options: { keyType: 'Integer' }, domainDesign }).getDomainKind()).toEqual('IntList');
        expect(
            ListModel.create({ options: { keyType: 'AutoIncrementInteger' }, domainDesign }).getDomainKind()
        ).toEqual('IntList');
        expect(ListModel.create({ options: { keyType: undefined }, domainDesign }).getDomainKind()).toBeFalsy();
    });

    test('getOptions', () => {
        const existingModel = ListModel.create(getDomainDetailsJSON);

        const options = existingModel.getOptions();
        expect(options).not.toHaveProperty('exception');
        expect(options).not.toHaveProperty('domain');
        expect(options).toHaveProperty('name');
        expect(options).toHaveProperty('description');
        expect(options).toHaveProperty('discussionSetting');

        const PKFieldName = existingModel
            .getIn(['domain', 'fields'])
            .filter(field => {
                return field.isPrimaryKey;
            })
            .get(0)
            .get('name');
        const optionsPKName = existingModel.get('keyName');

        expect(PKFieldName).toEqual(options['keyName']);
        expect(optionsPKName).toEqual(options['keyName']);
    });
});
