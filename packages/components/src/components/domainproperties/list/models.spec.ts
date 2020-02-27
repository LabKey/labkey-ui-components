import {ListModel} from "./models";
import {DEFAULT_LIST_SETTINGS} from "../../../test/data/constants";
import getDomainDetailsJSON from "../../../test/data/property-getDomainDetails.json";

describe('ListModel', () => {

    test("new model", () => {
        const newModel = ListModel.create(null, DEFAULT_LIST_SETTINGS);

        expect(newModel.getIn(['domain', 'name'])).toEqual(undefined);
        expect(newModel.getIn(['domain', 'domainId'])).toEqual(null);
        expect(newModel.getIn(['name'])).toEqual(null);
        expect(newModel.getIn(['keyType'])).toEqual(null);

        expect(newModel.isNew()).toEqual(true);
    });

    test("existing model", () => {
        const existingModel = ListModel.create(getDomainDetailsJSON);

        expect(existingModel.getIn(['domain', 'name'])).toEqual('NIMHDemographics');
        expect(existingModel.getIn(['domain', 'domainId'])).toEqual(2280);
        expect(existingModel.getIn(['name'])).toEqual('NIMHDemographics');
        expect(existingModel.getIn(['keyType'])).toEqual('Integer');
        expect(existingModel.getIn(['keyName'])).toEqual('SubjectID');

        expect(existingModel.isNew()).toEqual(false);
    });

    test("isValid", () => {
        const validModel = ListModel.create(getDomainDetailsJSON);
        expect(ListModel.isValid(validModel)).toEqual(true);

        const invalidModelNoName = validModel.set('name', "") as ListModel;
        expect(ListModel.isValid(invalidModelNoName)).toEqual(false);

        const invalidModelHasUndefinedKeyType = validModel.set('keyType', undefined) as ListModel;
        expect(ListModel.isValid(invalidModelHasUndefinedKeyType)).toEqual(false);

        const invalidModelHasException = validModel.setIn(['domain', 'domainException'], {severity: "Error"}) as ListModel;
        expect(ListModel.isValid(invalidModelHasException)).toEqual(false);
    });

    test("getOptions", () => {
        const existingModel = ListModel.create(getDomainDetailsJSON);

        const PKFieldName = existingModel.getIn(['domain', 'fields']).filter((field) => {return field.isPrimaryKey}).get(0).get('name');
        const keyName = existingModel.get('keyName');
        expect(PKFieldName).toEqual(keyName);
    });
});
