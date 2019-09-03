import * as React from "react";
import {mount} from "enzyme";
import renderer from 'react-test-renderer'
import {AssayPropertiesPanel} from "./AssayPropertiesPanel";
import { AssayProtocolModel } from "../../models";

describe('AssayPropertiesPanel', () => {

    test('default properties', () => {
        const tree = renderer.create(
            <AssayPropertiesPanel
                onChange={jest.fn}
            />
        );

        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('asPanel and showEditSettings', () => {
        const tree = renderer.create(
            <AssayPropertiesPanel
                asPanel={false}
                showEditSettings={false}
                onChange={jest.fn}
            />
        );

        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('panelCls, initCollapsed, and markComplete', () => {
        const tree = renderer.create(
            <AssayPropertiesPanel
                panelCls={'panel-primary'}
                collapsible={false}
                initCollapsed={true}
                markComplete={true}
                onChange={jest.fn}
            />
        );

        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('with initial model', () => {
        const tree = renderer.create(
            <AssayPropertiesPanel
                model={AssayProtocolModel.create({
                    protocolId: 0,
                    name: 'name should not be editable',
                    description: 'test description for this assay',
                    editableRuns: true,
                    editableResults: true
                })}
                onChange={jest.fn}
            />
        );

        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('collapsible', () => {
        const component = (
            <AssayPropertiesPanel
                collapsible={true}
                onChange={jest.fn}
            />
        );

        const wrapper = mount(component);
        expect(wrapper.find('.panel-body')).toHaveLength(1);
        wrapper.find('.pull-right').last().simulate('click'); // expand/collapse toggle click
        expect(wrapper.find('.panel-body')).toHaveLength(0);
        wrapper.find('.pull-right').last().simulate('click'); // expand/collapse toggle click
        expect(wrapper.find('.panel-body')).toHaveLength(1);
        wrapper.unmount();
    });
});