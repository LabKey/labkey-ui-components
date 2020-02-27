import {ListModel} from "./models";
import {mount} from "enzyme";
import toJson from 'enzyme-to-json';
import React from "react";
import {SetKeyFieldNamePanel} from "./SetKeyFieldNamePanel";
import getDomainDetailsJSON from "../../../test/data/property-getDomainDetails.json";
import getDomainDetailsWithAutoIncPKJSON from "../../../test/data/property-getDomainDetails-withAutoIntPK.json";

const populatedExistingModel = ListModel.create(getDomainDetailsJSON);
const populatedExitingModelWithAutoIncPK = ListModel.create(getDomainDetailsWithAutoIncPKJSON);

describe('SetKeyFieldNamePanel', () => {

    test('new list, default properties', () => {
        const setKeyFieldNamePanel = mount(
            <SetKeyFieldNamePanel
                model={populatedExistingModel}
                onModelChange={(model: ListModel) => {}}
                domain={populatedExistingModel.domain}
                domainIndex={1}
            />
        );

        expect(toJson(setKeyFieldNamePanel)).toMatchSnapshot();
        setKeyFieldNamePanel.unmount();
    });

    test("list with auto integer key", () => {
        const setKeyFieldNamePanel = mount(
            <SetKeyFieldNamePanel
                model={populatedExitingModelWithAutoIncPK}
                onModelChange={(model: ListModel) => {}}
                domain={populatedExistingModel.domain}
                domainIndex={1}
            />
        );

        expect(toJson(setKeyFieldNamePanel)).toMatchSnapshot();
        setKeyFieldNamePanel.unmount();
    });

    test("key fields that are unnamed, or are not of string or int dataType, are invalid", () => {
        const setKeyFieldNamePanel = mount(
            <SetKeyFieldNamePanel
                model={populatedExistingModel}
                onModelChange={(model: ListModel) => {}}
                domain={populatedExistingModel.domain}
                domainIndex={1}
            />
        );

        const selectOptionsText = setKeyFieldNamePanel.find('.form-control').text();
        expect(selectOptionsText).toContain('SubjectID');
        expect(selectOptionsText).toContain('Name');
        expect(selectOptionsText).toContain('Family');
        expect(selectOptionsText).toContain('Species');
        expect(selectOptionsText).toContain('MaritalStatus');
        expect(selectOptionsText).toContain('CurrentStatus');
        expect(selectOptionsText).toContain('Gender');

        expect(selectOptionsText).toContain('Auto integer');

        expect(selectOptionsText).not.toContain('Mothers');
        expect(selectOptionsText).not.toContain('Father');
        expect(selectOptionsText).not.toContain('Image');
        expect(selectOptionsText).not.toContain('Occupation');
        expect(selectOptionsText).not.toContain('BirthDate');
        expect(selectOptionsText).not.toContain('CartoonAvailable');
    });
});
