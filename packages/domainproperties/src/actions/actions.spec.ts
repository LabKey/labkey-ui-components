import {createFormInputId, getDataType} from "./actions";
import {DomainField} from "../models";
import {DOMAIN_FIELD_PREFIX, FLAG_CONCEPT_URI, INT_RANGE_URI, STRING_RANGE_URI, USER_RANGE_URI} from "../constants";

describe("domain properties actions", () => {

    test("test create id", () => {
        return expect(createFormInputId("marty", 100)).toBe(DOMAIN_FIELD_PREFIX + "-marty-100");
    });

    test("test get field type", () => {
        const field1 = new DomainField({
            name: 'field1name',
            rangeURI: INT_RANGE_URI,
            propertyId: 0,
            propertyURI: 'test'
        });
        expect(getDataType(field1).rangeURI).toBe(INT_RANGE_URI);

        const field2 = new DomainField({
            name: 'field2name',
            rangeURI: STRING_RANGE_URI,
            conceptURI: FLAG_CONCEPT_URI,
            propertyId: 0,
            propertyURI: 'test'
        });
        expect(getDataType(field2).name).toBe('flag');

        const field3 = new DomainField({
            name: 'field3name',
            rangeURI: USER_RANGE_URI,
            propertyId: 0,
            propertyURI: 'test'
        });
        expect(getDataType(field3).name).toBe('users')
    });

});