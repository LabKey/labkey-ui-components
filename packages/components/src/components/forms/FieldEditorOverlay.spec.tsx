import React from 'react';
import { fromJS } from "immutable";

import { FieldEditorOverlay, QueryColumn, QueryInfo } from '../../index';
import { mount } from 'enzyme';

const queryInfo = QueryInfo.create({columns: fromJS({
        description: QueryColumn.create({caption: 'Description', fieldKey: 'Description', inputType: 'textarea'}),
        value: QueryColumn.create({caption: 'Value', fieldKey: 'Value', inputType: 'number'}),
        units: QueryColumn.create({caption: 'Units', fieldKey: 'Units', inputType: 'text'})
    })});

const DATA_ROW = {
    RowId: {value: 1},
    Description: {value: 'Test description.'},
    Value: {value: 1, displayValue: 1},
    Units: {value: 10, displayValue: "meters"}
};


describe('<FieldEditorOverlay/>', () => {

    test("isLoading", () => {
        const component = (
            <FieldEditorOverlay
                queryInfo={queryInfo}
                fieldProps={[{key: 'Description'}]}
                isLoading={true}
                row={undefined}
                onUpdate={jest.fn}
            />
        );
        const wrapper = mount(component);
        expect(wrapper.text()).toBe("");
        wrapper.unmount();
    });

    test('can update props with data', () => {
        const component = (
            <FieldEditorOverlay
                canUpdate={true}
                queryInfo={queryInfo}
                fieldProps={[{key: 'Description'}]}
                isLoading={false}
                row={DATA_ROW}
                onUpdate={jest.fn}
            />
        );
        const wrapper = mount(component);
        expect(wrapper.text()).toBe("Test description.");
        wrapper.unmount();
    });

    test('custom iconField', () => {
        const component = (
            <FieldEditorOverlay
                queryInfo={queryInfo}
                fieldProps={[{key: 'Description'}, {key: 'Value'}, {key: 'Units'}]}
                iconField={'Units'}
                isLoading={false}
                row={DATA_ROW}
                onUpdate={jest.fn}
            />
        );
        const wrapper = mount(component);
        expect(wrapper.text()).toBe("meters");
        wrapper.unmount();
    });

    test("do not show iconText", () => {
        const component = (
            <FieldEditorOverlay
                canUpdate={true}
                queryInfo={queryInfo}
                fieldProps={[{key: 'Description'}, {key: 'Value'}]}
                showIconText={false}
                isLoading={false}
                row={DATA_ROW}
                onUpdate={jest.fn}
            />
        );
        const wrapper = mount(component);
        expect(wrapper.find(".field-edit__icon").prop("title")).toBe("Edit Description");
        expect(wrapper.find("span")).toHaveLength(2);
        expect(wrapper.text()).toBe("");
        wrapper.unmount();
    });

    test('can update without data', () => {
        const component = (
            <FieldEditorOverlay
                canUpdate={true}
                queryInfo={queryInfo}
                fieldProps={[{key: 'Description'}]}
                isLoading={false}
                row={{}}
                onUpdate={jest.fn}
            />
        );
        const wrapper = mount(component);
        expect(wrapper.find(".field-edit__icon").prop("title")).toBe("Edit Description");
        expect(wrapper.find("span").at(2).text()).toBe("Click to add Description");
        wrapper.unmount();
    });

    test('custom caption', () => {
        const component = <FieldEditorOverlay
            canUpdate={true}
            queryInfo={queryInfo}
            fieldProps={[{key: 'Description'}]}
            isLoading={false}
            row={DATA_ROW}
            onUpdate={jest.fn}
            caption={'storage description'}
        />;
        const wrapper = mount(component);
        expect(wrapper.find(".field-edit__icon").prop("title")).toBe("Edit storage description");
        wrapper.unmount();
    });

    test('user without update perm', () => {
        const component = <FieldEditorOverlay
            queryInfo={queryInfo}
            fieldProps={[{key: 'Description'}]}
            isLoading={false}
            row={DATA_ROW}
            onUpdate={jest.fn}
        />;
        const wrapper = mount(component);
        expect(wrapper.text()).toBe('Test description.');
        wrapper.unmount();
    });

    test('user cannot see value', () => {
        const component = <FieldEditorOverlay
            queryInfo={queryInfo}
            fieldProps={[{key: 'Description'}]}
            isLoading={false}
            row={DATA_ROW}
            onUpdate={jest.fn}
            showValueOnNotAllowed={false}
        />;
        const wrapper = mount(component);

        expect(wrapper.text()).toBe("");
        wrapper.unmount();
    });
});
