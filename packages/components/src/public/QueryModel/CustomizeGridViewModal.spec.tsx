import React from 'react';
import { ColumnChoice, ColumnInView, CustomizeGridViewModal } from './CustomizeGridViewModal';
import { mount, ReactWrapper } from 'enzyme';
import { QueryColumn } from '../QueryColumn';
import { Modal, OverlayTrigger } from 'react-bootstrap';
import { makeTestQueryModel } from './testUtils';
import { SchemaQuery } from '../SchemaQuery';
import { QueryInfo } from '../QueryInfo';
import { ViewInfo } from '../../internal/ViewInfo';
import { fromJS } from 'immutable';
import { wrapDraggable } from '../../internal/testHelpers';

describe("ColumnChoice", () => {
    test("isInView", () => {
        const wrapper = mount(
            <ColumnChoice
                column={QueryColumn.create({name: "testColumn", caption: "Test Column", fieldKey: "testColumn", fieldKeyArray: ["testColumn"]})}
                index={1}
                isInView={true}
                onAddColumn={jest.fn()}
            />);
        expect(wrapper.find(".field-name").text()).toBe("Test Column");
        expect(wrapper.find(".fa-check").exists()).toBeTruthy();
        expect(wrapper.find(".fa-plus").exists()).toBeFalsy();
        wrapper.unmount();
    });

    test("not isInView", () => {
        const wrapper = mount(
            <ColumnChoice
                column={QueryColumn.create({name: "testColumn", caption: "Test Column", fieldKey: "testColumn", fieldKeyArray: ["testColumn"]})}
                index={1}
                isInView={false}
                onAddColumn={jest.fn()}
            />);
        expect(wrapper.find(".field-name").text()).toBe("Test Column");
        expect(wrapper.find(".fa-check").exists()).toBeFalsy();
        expect(wrapper.find(".fa-plus").exists()).toBeTruthy();
        wrapper.unmount();
    });

});

describe("ColumnInView", () => {

    function validate(wrapper: ReactWrapper, column: QueryColumn, canBeRemoved: boolean) {
        const fieldName = wrapper.find(".field-name");
        expect(fieldName.text()).toBe(column.caption);
        const removeIcon = wrapper.find(".fa-times");
        expect(removeIcon.exists()).toBeTruthy();
        const iconParent = removeIcon.parent();
        if (canBeRemoved) {
            expect(iconParent.prop("className")).toContain("clickable")
            expect(iconParent.prop("onClick")).toBeDefined();
        } else {
            expect(iconParent.prop("className")).toContain("text-muted disabled");
            expect(iconParent.prop("onClick")).toBeNull();
        }
        if (!canBeRemoved) {
            expect(wrapper.find(OverlayTrigger).exists()).toBeTruthy();
        }
    }

    test("remove enabled", () => {

        const column = QueryColumn.create({name: "testColumn", caption: "Test Column", fieldKey: "testColumn", fieldKeyArray: ["testColumn"]});

        const wrapper = mount(
            wrapDraggable(
                <ColumnInView
                    column={column}
                    index={1}
                    onColumnRemove={jest.fn()}
                    onClick={jest.fn}
                    selected={undefined}
                />
            )
        );
        validate(wrapper, column, true);
        wrapper.unmount();

    });

    test("remove disabled", () => {
        const column = QueryColumn.create({name: "testColumn", caption: "Test Column", addToDisplayView: true, fieldKey: "testColumn", fieldKeyArray: ["testColumn"]});

        const wrapper = mount(
            wrapDraggable(
                <ColumnInView
                    column={column}
                    index={1}
                    onColumnRemove={jest.fn()}
                    onClick={jest.fn}
                    selected={undefined}
                />
            )
        );
        validate(wrapper, column, false);
        wrapper.unmount();
    });

});

describe("CustomizeGridViewModal", () => {
    const FIELD_1_COL = new QueryColumn({ name: "field1", fieldKey: "field1", fieldKeyArray: ["field1"] });
    const FIELD_2_COL = new QueryColumn({ name: "field2", fieldKey: "field2", fieldKeyArray: ["field2"]});
    const FIELD_3_COL = new QueryColumn({name: "field3", fieldKey: "field3", fieldKeyArray: ["field3"]});
    const SYSTEM_COL = new QueryColumn({ name: "systemCol", fieldKey: "systemCol", hidden: true, fieldKeyArray: ["systemCol"]});
    const HIDDEN_COL = new QueryColumn({ name: "hiddenCol", fieldKey: "hiddenCol", hidden: true, fieldKeyArray: ["hiddenCol"]});
    const columns = fromJS({
        field1: FIELD_1_COL,
        field2: FIELD_2_COL,
        field3: FIELD_3_COL,
        systemCol: SYSTEM_COL,
        hiddenCol: HIDDEN_COL,
    });

    const QUERY_NAME = "queryTest";

    test("With title, no view", () => {
        const view = ViewInfo.create({ name: 'default' });
        const queryInfo = QueryInfo.create({
            views: fromJS({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
            columns,
        });
        let model = makeTestQueryModel(SchemaQuery.create("test", QUERY_NAME), queryInfo);
        model = model.mutate({title: "Title"});
        const wrapper = mount(
            <CustomizeGridViewModal
                model={model}
                onCancel={jest.fn()}
                onUpdate={jest.fn()}
            />
        );
        expect(wrapper.find(Modal.Title).text()).toBe("Customize Title Grid");
        wrapper.unmount();
    });

    test("Without title, with view name", () => {
        const viewName = 'viewForTesting'
        const view = ViewInfo.create({ name: viewName });
        const queryInfo = QueryInfo.create({
            views: fromJS({ [viewName.toLowerCase()]: view }),
            columns,
        });
        const model = makeTestQueryModel(SchemaQuery.create("test", QUERY_NAME, viewName), queryInfo);
        const wrapper = mount(
            <CustomizeGridViewModal
                model={model}
                onCancel={jest.fn()}
                onUpdate={jest.fn()}
            />
        );
        expect(wrapper.find(Modal.Title).text()).toBe("Customize " + QUERY_NAME + " Grid - " + viewName);
        wrapper.unmount();
    });

    test("Columns in View and All Fields, ", () => {
        const view = ViewInfo.create({
            name: ViewInfo.DEFAULT_NAME,
            columns: [
                FIELD_1_COL,
                FIELD_2_COL
            ]
        });
        const queryInfo = QueryInfo.create({
            views: fromJS({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
            columns,
        });
        const model = makeTestQueryModel(SchemaQuery.create("test", QUERY_NAME), queryInfo);
        const wrapper = mount(
            <CustomizeGridViewModal
                model={model}
                onCancel={jest.fn()}
                onUpdate={jest.fn()}
            />
        );
        let columnChoices = wrapper.find(ColumnChoice);
        expect(columnChoices).toHaveLength(3);
        expect(columnChoices.at(0).text()).toBe(FIELD_1_COL.name);
        expect(columnChoices.at(0).prop("isInView")).toBe(true);
        expect(columnChoices.at(1).text()).toBe(FIELD_2_COL.name);
        expect(columnChoices.at(1).prop("isInView")).toBe(true);
        expect(columnChoices.at(2).text()).toBe(FIELD_3_COL.name);
        expect(columnChoices.at(2).prop("isInView")).toBe(false);

        const columnsInView = wrapper.find(ColumnInView);
        expect(columnsInView).toHaveLength(2);
        expect(columnsInView.at(0).text()).toBe(FIELD_1_COL.name);
        expect(columnsInView.at(1).text()).toBe(FIELD_2_COL.name);

        const toggleAll = wrapper.find("input");
        toggleAll.simulate('change', { target: { checked: true } });
        columnChoices = wrapper.find(ColumnChoice);
        expect(columnChoices).toHaveLength(5);
        expect(columnChoices.at(0).text()).toBe(FIELD_1_COL.name);
        expect(columnChoices.at(1).text()).toBe(FIELD_2_COL.name);
        expect(columnChoices.at(2).text()).toBe(FIELD_3_COL.name);
        expect(columnChoices.at(3).text()).toBe(SYSTEM_COL.name);
        expect(columnChoices.at(3).prop("isInView")).toBe(false);
        expect(columnChoices.at(4).text()).toBe(HIDDEN_COL.name);
        expect(columnChoices.at(4).prop("isInView")).toBe(false);

        // no changes made yet, so update button is disabled
        let updateButton = wrapper.find(".btn-success");
        expect(updateButton.prop("disabled")).toBe(true);

        // remove a field, expect button to become enabled
        wrapper.find(".fa-times").at(0).simulate("click");
        updateButton = wrapper.find(".btn-success");
        expect (updateButton.prop("disabled")).toBeFalsy();
        expect(wrapper.find(ColumnChoice).at(0).prop("isInView")).toBe(false);
        expect(wrapper.find(ColumnInView)).toHaveLength(1);

        // remove the other field in the view and expect button to become disabled again
        wrapper.find(".fa-times").at(0).simulate("click");
        updateButton = wrapper.find(".btn-success");
        expect(updateButton.prop("disabled")).toBe(true);
        expect(wrapper.find(ColumnInView)).toHaveLength(0);

        // add back one of the hidden columns
        wrapper.find(ColumnChoice).at(4).find(".fa-plus").simulate("click");
        expect(wrapper.find(".btn-success").prop("disabled")).toBeFalsy();

        wrapper.unmount();
    });

    test("with selectedColumn", () => {
        const view = ViewInfo.create({
            name: ViewInfo.DEFAULT_NAME,
            columns: [
                FIELD_1_COL,
                FIELD_2_COL
            ]
        });
        const queryInfo = QueryInfo.create({
            views: fromJS({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
            columns,
        });
        const model = makeTestQueryModel(SchemaQuery.create("test", QUERY_NAME), queryInfo);
        const wrapper = mount(
            <CustomizeGridViewModal
                model={model}
                onCancel={jest.fn()}
                onUpdate={jest.fn()}
                selectedColumn={FIELD_2_COL}
            />
        );
        let colsInView = wrapper.find(ColumnInView);
        // selected column passed in should be highlighted
        expect(colsInView.at(0).prop('selected')).toBe(false);
        expect(colsInView.at(1).prop('selected')).toBe(true);

        // clicking a new column should change the selected index
        colsInView.at(0).find(".field-name").simulate("click");
        colsInView = wrapper.find(ColumnInView);
        expect(colsInView.at(0).prop('selected')).toBe(true);
        expect(colsInView.at(1).prop('selected')).toBe(false);

        // clicking on the same column should unselect
        colsInView.at(0).find('.field-name').simulate("click");
        colsInView = wrapper.find(ColumnInView);
        expect(colsInView.at(0).prop('selected')).toBe(false);
        expect(colsInView.at(1).prop('selected')).toBe(false);
    });
});
