import React from 'react';
import { SampleFinderHeaderButtons, SampleFinderSection } from './SampleFinderSection';
import { mount } from 'enzyme';
import { TEST_USER_EDITOR } from '../../../test/data/users';
import { TestTypeDataType } from '../../../test/data/constants';
import { Section } from '../base/Section';
import { FilterCards } from './FilterCards';
import { capitalizeFirstChar } from '../../util/utils';


describe("SampleFinderSection", () => {

    test("SampleFinderHeaderButtons", () => {
        const wrapper = mount(
            <SampleFinderHeaderButtons parentEntityDataTypes={[
                TestTypeDataType,
                { ...TestTypeDataType, nounSingular: "Other", nounAsParentSingular: "Other Parent"}
            ]} onAddEntity={jest.fn} />
        )
        const buttons = wrapper.find("button");
        expect(buttons.length).toBe(2);
        expect(buttons.at(0).text()).toBe(" " + capitalizeFirstChar(TestTypeDataType.nounAsParentSingular) + " Properties");
        expect(buttons.at(1).text()).toBe(" Other Parent Properties")

    });

    test("No cards", () => {
        const wrapper = mount(
            <SampleFinderSection
                user={TEST_USER_EDITOR}
                getSampleAuditBehaviorType={jest.fn()}
                samplesEditableGridProps={{}}
                parentEntityDataTypes={[TestTypeDataType]}
            />
        );
        const section = wrapper.find(Section);
        expect(section.prop("title")).toBe("Find Samples");
        expect(section.prop("caption")).toBe("Find samples that meet all of these criteria");
        expect(section.find(".filter-hint").exists()).toBeTruthy();
        const cards = wrapper.find(FilterCards);
        expect(cards.prop("className")).toBe("empty");
    });

});
