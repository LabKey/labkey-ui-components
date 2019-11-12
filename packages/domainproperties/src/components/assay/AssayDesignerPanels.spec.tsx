import * as React from "react";
import {List, Map} from "immutable";
import {mount} from "enzyme";
import { FileAttachmentForm } from "@glass/base";

import {AssayDesignerPanels} from "./AssayDesignerPanels";
import { AssayProtocolModel, DomainDesign } from "../../models";
import {Panel} from "react-bootstrap";
import toJson from "enzyme-to-json";

const EXISTING_MODEL = AssayProtocolModel.create({
    protocolId: 1,
    name: 'Test Assay Protocol',
    description: 'My assay protocol for you all to use.',
    editableRuns: true,
    allowEditableResults: true,
    editableResults: true,
    allowBackgroundUpload: true,
    backgroundUpload: true,
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

const EMPTY_MODEL  = AssayProtocolModel.create({
    providerName: 'General',
    domains: List([
        DomainDesign.create({name: 'Batch Fields'}),
        DomainDesign.create({name: 'Run Fields'}),
        DomainDesign.create({name: 'Data Fields'})
    ])
});

function getButton(wrapper: any, text: string) {
    return wrapper.findWhere(n => n.type() === 'button' && n.text() === text);
}

const nameInputId = 'assay-design-name';
function setAssayName(wrapper: any, value: string) {
    const nameInputValue = { id: nameInputId, value: value };
    wrapper.find('input#' + nameInputId).simulate('focus').simulate('change', { target: nameInputValue});
}

describe('AssayDesignerPanels', () => {

    test('default properties', () => {
        const form = mount(
            <AssayDesignerPanels
                initModel={EMPTY_MODEL}
                onCancel={jest.fn}
                onComplete={jest.fn}
            />
        );

        expect(toJson(form)).toMatchSnapshot();
        form.unmount();
    });

    test('initModel', () => {
        const form = mount(
            <AssayDesignerPanels
                initModel={EXISTING_MODEL}
                onCancel={jest.fn}
                onComplete={jest.fn}
            />
        );

        expect(toJson(form)).toMatchSnapshot();
        form.unmount();
    });

    test('hideEmptyBatchDomain for new assay', () => {
        const form = mount(
            <AssayDesignerPanels
                initModel={EMPTY_MODEL}
                hideEmptyBatchDomain={true}
                onCancel={jest.fn}
                onComplete={jest.fn}
            />
        );

        expect(toJson(form)).toMatchSnapshot();
        form.unmount();
    });

    test('hideEmptyBatchDomain with initModel', () => {
        const form = mount(
            <AssayDesignerPanels
                initModel={EXISTING_MODEL}
                hideEmptyBatchDomain={true}
                onCancel={jest.fn}
                onComplete={jest.fn}
            />
        );

        expect(toJson(form)).toMatchSnapshot();
        form.unmount();
    });

    test('basePropertiesOnly for new assay', () => {
        const form = mount(
            <AssayDesignerPanels
                initModel={EMPTY_MODEL}
                basePropertiesOnly={true}
                onCancel={jest.fn}
                onComplete={jest.fn}
            />
        );

        expect(toJson(form)).toMatchSnapshot();
        form.unmount();
    });

    test('basePropertiesOnly with initModel', () => {
        const form = mount(
            <AssayDesignerPanels
                initModel={EXISTING_MODEL}
                basePropertiesOnly={true}
                onCancel={jest.fn}
                onComplete={jest.fn}
            />
        );

        expect(toJson(form)).toMatchSnapshot();
        form.unmount();
    });

    // TODO determine if this test is still valid and should be updated with new assay designer changes to move away from wizard next/back buttons
    // test('new assay wizard', () => {
    //     const component = (
    //         <AssayDesignerPanels
    //             initModel={EMPTY_MODEL}
    //             onCancel={jest.fn}
    //             onComplete={jest.fn}
    //         />
    //     );
    //
    //     function verifyActivePanel(wrapper: any, assayPropsActive: boolean, batchActive: boolean, runActive: boolean, resultsActive: boolean) {
    //         expect(wrapper.find(AssayPropertiesPanel)).toHaveLength(1);
    //         expect(wrapper.find(DomainForm)).toHaveLength(3);
    //         setTimeout(() => {
    //             expect(wrapper.find({className: 'panel-collapse collapse in'})).toHaveLength(1);
    //             expect(wrapper.find(NameInput)).toHaveLength(assayPropsActive ? 1 : 0);
    //             expect(wrapper.find('div.domain-form-no-field-panel')).toHaveLength(batchActive || runActive ? 1 : 0);
    //             expect(wrapper.find(FileAttachmentForm)).toHaveLength(resultsActive ? 1 : 0);
    //         }, 1000);
    //     }
    //
    //     const wrapper = mount(component);
    //     verifyActivePanel(wrapper, true, false, false, false);
    //     expect(getButton(wrapper, 'Next').props().disabled).toBeTruthy();
    //     expect(getButton(wrapper, 'Finish')).toHaveLength(0);
    //
    //     // set the assay name, which should enable the next button
    //     setAssayName(wrapper, 'Foo');
    //     expect(getButton(wrapper, 'Next').props().disabled).toBeFalsy();
    //     expect(getButton(wrapper, 'Finish')).toHaveLength(0);
    //
    //     // click Next to advance in the wizard to the Batch Fields
    //     getButton(wrapper, 'Next').simulate('click');
    //     verifyActivePanel(wrapper, false, true, false, false);
    //     expect(getButton(wrapper, 'Next').props().disabled).toBeFalsy();
    //     expect(getButton(wrapper, 'Finish')).toHaveLength(0);
    //
    //     // click Next to advance in the wizard to the Run Fields
    //     getButton(wrapper, 'Next').simulate('click');
    //     verifyActivePanel(wrapper, false, false, true, false);
    //     expect(getButton(wrapper, 'Next').props().disabled).toBeFalsy();
    //     expect(getButton(wrapper, 'Finish')).toHaveLength(0);
    //
    //     // click Next to advance in the wizard to the Data Fields
    //     getButton(wrapper, 'Next').simulate('click');
    //     verifyActivePanel(wrapper, false, false, false, true);
    //     expect(getButton(wrapper, 'Next')).toHaveLength(0);
    //     expect(getButton(wrapper, 'Finish')).toHaveLength(1);
    //     expect(getButton(wrapper, 'Finish').props().disabled).toBeFalsy();
    //
    //     wrapper.unmount();
    // });

    test('infer from file', () => {
        function validateInferFromFile(model: AssayProtocolModel, shouldInfer: boolean) {
            const component = (<AssayDesignerPanels initModel={model} onCancel={jest.fn} onComplete={jest.fn}/>);
            const wrapper = mount(component);
            setAssayName(wrapper, 'Foo');
            expect(wrapper.find(FileAttachmentForm)).toHaveLength(shouldInfer ? 1 : 0);
            wrapper.unmount();
        }

        // General assay with Data domain should show infer from files component
        validateInferFromFile(AssayProtocolModel.create({
            providerName: 'General',
            domains: List([DomainDesign.create({name: 'Data Fields'})])
        }), true);

        // General assay with non-Data domain should not show infer from files component
        validateInferFromFile(AssayProtocolModel.create({
            providerName: 'General',
            domains: List([DomainDesign.create({name: 'Results Fields'})])
        }), false);

        // Other assay with Data domain should not show infer from files component
        validateInferFromFile(AssayProtocolModel.create({
            providerName: 'Other',
            domains: List([DomainDesign.create({name: 'Data Fields'})])
        }), false);
    });

    test('Show app headers', () => {
        const _appHeaderId = 'mock-app-header';
        const _appHeaderText = 'This is a mock app header';

        const mockAppHeader = jest.fn();
        mockAppHeader.mockReturnValue(<><div id={_appHeaderId}>{_appHeaderText}</div></>);

        const component = (
            <AssayDesignerPanels
                initModel={EXISTING_MODEL}
                onCancel={jest.fn}
                onComplete={jest.fn}
                appDomainHeaders={Map({'Sample': mockAppHeader})}
            />
        );

        let wrapper = mount(component);
        //Open Sample Fields panel body
        wrapper.find(Panel.Heading).filterWhere(n => n.text().indexOf('Sample Fields') === 0).simulate('click');
        expect(wrapper.find('#' + _appHeaderId)).toHaveLength(1);
        expect(wrapper.find('#' + _appHeaderId).text()).toBe(_appHeaderText);
    });

});