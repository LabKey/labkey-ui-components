import * as React from "react";
import {List} from "immutable";
import {mount} from "enzyme";
import renderer from 'react-test-renderer'
import { AssayPropertiesPanel, FORM_IDS } from "./AssayPropertiesPanel";
import { AssayProtocolModel, DomainDesign } from "../../models";
import { LK_DOMAIN_HELP_URL } from "../../constants";
import {
    BackgroundUploadInput,
    DescriptionInput,
    DetectionMethodsInput,
    EditableResultsInput,
    EditableRunsInput,
    MetadataInputFormatsInput,
    NameInput,
    PlateTemplatesInput,
    QCStatesInput,
    SaveScriptDataInput,
    TransformScriptsInput
} from "./AssayPropertiesInput";

const EMPTY_MODEL = AssayProtocolModel.create({
    providerName: 'General',
    domains: List([
        DomainDesign.create({name: 'Batch Fields'}),
        DomainDesign.create({name: 'Run Fields'}),
        DomainDesign.create({name: 'Data Fields'})
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

    test('asPanel, helpURL, and basePropertiesOnly', () => {
        const tree = renderer.create(
            <AssayPropertiesPanel
                model={EMPTY_MODEL}
                asPanel={false}
                basePropertiesOnly={true}
                helpURL={LK_DOMAIN_HELP_URL}
                onChange={jest.fn}
            />
        );

        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('without helpURL', () => {
        const tree = renderer.create(
            <AssayPropertiesPanel
                model={EMPTY_MODEL}
                helpURL={null}
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
                model={AssayProtocolModel.create({protocolId: 1, name: 'With Name'})}
                collapsible={true}
                onChange={jest.fn}
            />
        );

        const wrapper = mount(component);
        expect(wrapper.find('.panel-body')).toHaveLength(1);
        expect(wrapper.find('.panel-heading').text()).toBe('Assay Properties');
        wrapper.find('.pull-right').last().simulate('click'); // expand/collapse toggle click
        expect(wrapper.find('.panel-body')).toHaveLength(0);
        expect(wrapper.find('.panel-heading').text()).toBe('Assay Properties (With Name)');
        wrapper.find('.pull-right').last().simulate('click'); // expand/collapse toggle click
        expect(wrapper.find('.panel-body')).toHaveLength(1);
        expect(wrapper.find('.panel-heading').text()).toBe('Assay Properties');
        wrapper.unmount();
    });

    test('visible properties based on empty AssayProtocolModel', () => {
        const simpleModelWrapper = mount(<AssayPropertiesPanel model={EMPTY_MODEL} onChange={jest.fn}/>);
        expect(simpleModelWrapper.find(NameInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(DescriptionInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(QCStatesInput)).toHaveLength(0);
        expect(simpleModelWrapper.find(PlateTemplatesInput)).toHaveLength(0);
        expect(simpleModelWrapper.find(DetectionMethodsInput)).toHaveLength(0);
        expect(simpleModelWrapper.find(MetadataInputFormatsInput)).toHaveLength(0);
        expect(simpleModelWrapper.find(EditableRunsInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(EditableResultsInput)).toHaveLength(0);
        expect(simpleModelWrapper.find(BackgroundUploadInput)).toHaveLength(0);
        expect(simpleModelWrapper.find(TransformScriptsInput)).toHaveLength(0);
        expect(simpleModelWrapper.find(SaveScriptDataInput)).toHaveLength(0);
        simpleModelWrapper.unmount();
    });

    test('visible properties based on populated AssayProtocolModel', () => {
        const model = AssayProtocolModel.create({
            allowBackgroundUpload: true,
            allowEditableResults: true,
            allowQCStates: true,
            allowTransformationScript: true,
            availableDetectionMethods: ['a', 'b', 'c'],
            availableMetadataInputFormats: {test1: 'abc'},
            availablePlateTemplates: ['d','e','f'],
        });

        const simpleModelWrapper = mount(<AssayPropertiesPanel model={model} onChange={jest.fn}/>);
        expect(simpleModelWrapper.find(NameInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(DescriptionInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(QCStatesInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(PlateTemplatesInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(DetectionMethodsInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(MetadataInputFormatsInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(EditableRunsInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(EditableResultsInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(BackgroundUploadInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(TransformScriptsInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(SaveScriptDataInput)).toHaveLength(1);
        simpleModelWrapper.unmount();
    });

    test('visible properties for basePropertiesOnly based on populated AssayProtocolModel', () => {
        const model = AssayProtocolModel.create({
            allowBackgroundUpload: true,
            allowEditableResults: true,
            allowQCStates: true,
            availableDetectionMethods: ['a', 'b', 'c'],
            availableMetadataInputFormats: {test1: 'abc'},
            availablePlateTemplates: ['d','e','f'],
        });

        const simpleModelWrapper = mount(<AssayPropertiesPanel model={model} onChange={jest.fn} basePropertiesOnly={true}/>);
        expect(simpleModelWrapper.find(NameInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(DescriptionInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(QCStatesInput)).toHaveLength(0);
        expect(simpleModelWrapper.find(PlateTemplatesInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(DetectionMethodsInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(MetadataInputFormatsInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(EditableRunsInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(EditableResultsInput)).toHaveLength(1);
        expect(simpleModelWrapper.find(BackgroundUploadInput)).toHaveLength(0);
        expect(simpleModelWrapper.find(TransformScriptsInput)).toHaveLength(0);
        expect(simpleModelWrapper.find(SaveScriptDataInput)).toHaveLength(0);
        simpleModelWrapper.unmount();
    });
});