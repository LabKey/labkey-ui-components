import * as React from "react";
import {List} from "immutable";
import {mount} from "enzyme";
import renderer from 'react-test-renderer'
import {AssayPropertiesPanel} from "./AssayPropertiesPanel";
import { AssayProtocolModel, DomainDesign } from "../../models";

const EMPTY_MODEL  = new AssayProtocolModel({
    providerName: 'General',
    domains: List([
        DomainDesign.init('Batch'),
        DomainDesign.init('Run'),
        DomainDesign.init('Data')
    ])
});

describe('AssayPropertiesPanel', () => {

    test('default properties', () => {
        const tree = renderer.create(
            <AssayPropertiesPanel
                model={EMPTY_MODEL}
                onChange={jest.fn}
            />
        );

        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('asPanel and basePropertiesOnly', () => {
        const tree = renderer.create(
            <AssayPropertiesPanel
                model={EMPTY_MODEL}
                asPanel={false}
                basePropertiesOnly={true}
                onChange={jest.fn}
            />
        );

        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('panelCls, initCollapsed, and markComplete', () => {
        const tree = renderer.create(
            <AssayPropertiesPanel
                model={EMPTY_MODEL}
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
                    protocolId: 1,
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
                model={EMPTY_MODEL}
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