import React from 'react';
import { mount } from 'enzyme';
import { FilterCard } from './FilterCards';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { capitalizeFirstChar } from '../../util/utils';
import { TestTypeDataType } from '../../../test/data/constants';


describe("FilterCard", () => {

    const capParentNoun = capitalizeFirstChar(TestTypeDataType.nounAsParentSingular);
    test("no schemaQuery", () => {
        const wrapper = mount(<FilterCard entityDataType={TestTypeDataType} onAdd={jest.fn}/>);
        const header = wrapper.find('.filter-card__header');
        expect(header.prop("className")).toContain("without-secondary");
        expect(header.prop("className")).toContain(TestTypeDataType.filterCardHeaderClass);
        expect(header.text()).toContain(capParentNoun);
        expect(wrapper.find(".filter-card__card-content").exists()).toBeFalsy();
        const content = wrapper.find(".filter-card__empty-content");
        expect(content.exists()).toBeTruthy();
        expect(content.text().trim()).toBe("+");
        wrapper.unmount();
    });

    test("empty filters", () => {
        const wrapper = mount(<FilterCard
            entityDataType={TestTypeDataType}
            schemaQuery={SchemaQuery.create("testSample", "parent")}
            filterArray={[]}
            onAdd={jest.fn}
            onEdit={jest.fn}
            onDelete={jest.fn}
        />);
        const header = wrapper.find('.filter-card__header');
        expect(header.prop("className").indexOf("without-secondary")).toBe(-1);
        expect(header.prop("className")).toContain(TestTypeDataType.filterCardHeaderClass);
        expect(header.find(".secondary-text").text()).toBe(capParentNoun)
        expect(header.find(".primary-text").text()).toBe("parent")
        expect(header.find(".fa-pencil").exists()).toBeTruthy();
        expect(header.find(".fa-trash").exists()).toBeTruthy();

        expect(wrapper.find(".filter-card__empty-content").exists()).toBeFalsy();
        const content = wrapper.find(".filter-card__card-content");
        expect(content.exists()).toBeTruthy();
        expect(content.text().trim()).toBe("Showing all parent Samples");
        wrapper.unmount();
    });

});

