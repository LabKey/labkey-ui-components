import * as React from "react";
import {mount} from "enzyme";
import renderer from 'react-test-renderer'
import {AssayDesignerPanels} from "./AssayDesignerPanels";
import { AssayProtocolModel } from "../../models";
import DomainForm from "../DomainForm";
import { AssayPropertiesPanel } from "./AssayPropertiesPanel";
import { FileAttachmentForm } from "@glass/base";

const model = AssayProtocolModel.create({
    protocolId: 1,
    name: 'Test Assay Protocol',
    description: 'My assay protocol for you all to use.',
    editableRuns: true,
    editableResults: true,
    domains: [{
        name: 'Batch Fields'
    },{
        name: 'Sample Fields',
        fields: [{
            name: 'field1',
            rangeURI: 'xsd:string'
        },{
            name: 'field2',
            rangeURI: 'xsd:int'
        },{
            name: 'field3',
            rangeURI: 'xsd:dateTime'
        }]
    }]
});

describe('AssayDesignerPanels', () => {

    test('default properties', () => {
        const tree = renderer.create(
            <AssayDesignerPanels
                onCancel={jest.fn}
                onComplete={jest.fn}
            />
        );

        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('initModel', () => {
        const tree = renderer.create(
            <AssayDesignerPanels
                initModel={model}
                onCancel={jest.fn}
                onComplete={jest.fn}
            />
        );

        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('hideEmptyBatchDomain for new assay', () => {
        const tree = renderer.create(
            <AssayDesignerPanels
                hideEmptyBatchDomain={true}
                onCancel={jest.fn}
                onComplete={jest.fn}
            />
        );

        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('hideEmptyBatchDomain with initModel', () => {
        const tree = renderer.create(
            <AssayDesignerPanels
                initModel={model}
                hideEmptyBatchDomain={true}
                onCancel={jest.fn}
                onComplete={jest.fn}
            />
        );

        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('new assay wizard', () => {
        const nameInputId = 'assay-design-name';
        const nameInputValue = { id: nameInputId, value: 'Foo' };

        const component = (
            <AssayDesignerPanels
                onCancel={jest.fn}
                onComplete={jest.fn}
            />
        );

        function getButton(wrapper: any, text: string) {
            return wrapper.findWhere(n => n.type() === 'button' && n.text() === text);
        }

        function getDomainPanelHeading(wrapper: any, text: string) {
            return wrapper.findWhere(n => n.type() === 'p' && n.text().indexOf(text) === 0);
        }

        function verifyActivePanel(wrapper: any, assayPropsActive: boolean, batchActive: boolean, runActive: boolean, resultsActive: boolean) {
            expect(wrapper.find(AssayPropertiesPanel)).toHaveLength(1);
            expect(wrapper.find(DomainForm)).toHaveLength(3);
            expect(wrapper.find('.panel-body')).toHaveLength(1);
            expect(wrapper.find('input#' + nameInputId)).toHaveLength(assayPropsActive ? 1 : 0);
            expect(wrapper.find('div.domain-form-no-field-panel')).toHaveLength(batchActive || runActive ? 1 : 0);
            expect(wrapper.find(FileAttachmentForm)).toHaveLength(resultsActive ? 1 : 0);
            expect(getDomainPanelHeading(wrapper, 'Define the batch properties')).toHaveLength(batchActive ? 1 : 0);
            expect(getDomainPanelHeading(wrapper, 'Define the run properties')).toHaveLength(runActive ? 1 : 0);
            expect(getDomainPanelHeading(wrapper, 'Define the data properties')).toHaveLength(resultsActive ? 1 : 0);
        }

        const wrapper = mount(component);
        verifyActivePanel(wrapper, true, false, false, false);
        expect(getButton(wrapper, 'Next').props().disabled).toBeTruthy();
        expect(getButton(wrapper, 'Finish')).toHaveLength(0);

        // set the assay name, which should enable the next button
        wrapper.find('input#' + nameInputId).simulate('focus').simulate('change', { target: nameInputValue});
        expect(getButton(wrapper, 'Next').props().disabled).toBeFalsy();
        expect(getButton(wrapper, 'Finish')).toHaveLength(0);

        // click Next to advance in the wizard to the Batch Properties
        getButton(wrapper, 'Next').simulate('click');
        verifyActivePanel(wrapper, false, true, false, false);
        expect(getButton(wrapper, 'Next').props().disabled).toBeFalsy();
        expect(getButton(wrapper, 'Finish')).toHaveLength(0);

        // click Next to advance in the wizard to the Run Properties
        getButton(wrapper, 'Next').simulate('click');
        verifyActivePanel(wrapper, false, false, true, false);
        expect(getButton(wrapper, 'Next').props().disabled).toBeFalsy();
        expect(getButton(wrapper, 'Finish')).toHaveLength(0);

        // click Next to advance in the wizard to the Data Properties
        getButton(wrapper, 'Next').simulate('click');
        verifyActivePanel(wrapper, false, false, false, true);
        expect(getButton(wrapper, 'Next')).toHaveLength(0);
        expect(getButton(wrapper, 'Finish')).toHaveLength(1);
        expect(getButton(wrapper, 'Finish').props().disabled).toBeFalsy();

        wrapper.unmount();
    });
});