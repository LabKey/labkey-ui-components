import {ListModel} from "./models";
import {mount} from "enzyme";
import toJson from 'enzyme-to-json';
import React from "react";
import {SetKeyFieldNamePanel} from "./SetKeyFieldNamePanel";
import getDomainDetailsJSON from "../../../test/data/property-getDomainDetails.json";

const populatedExistingModel = ListModel.create(getDomainDetailsJSON);

describe('SetKeyFieldNamePanel', () => {

    test('new list, default properties', () => {
        const basicPropertiesFields = mount(
            <SetKeyFieldNamePanel
                model={populatedExistingModel}
                onModelChange={(model: ListModel) => {}}
                domain={populatedExistingModel.domain} // todo rp, domainDesign?
                domainIndex={1}
            />
        );

        expect(toJson(basicPropertiesFields)).toMatchSnapshot();
        basicPropertiesFields.unmount();
    });

    test("key fields that are unnamed, or are not of string or int dataType, are invalid", () => {
    });

    test("key field has its dataType and required checkbox locked, and is not deletable", () => {
    });

    test("dropdown select has names in same order as domain's fields that are of type string or integer", () => {
    });

    test("choosing 'auto integer key' yields a key field of data type 'auto increment'", () => {
    });
});
