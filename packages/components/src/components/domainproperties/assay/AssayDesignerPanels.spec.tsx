import React from 'react';
import { List, Map } from 'immutable';
import { mount } from 'enzyme';

import { AssayDesignerPanels } from './AssayDesignerPanels';
import { DomainDesign } from '../models';
import { AssayProtocolModel } from '../assay/models';
import { DescriptionInput, NameInput } from './AssayPropertiesInput';
import { Panel } from 'react-bootstrap';
import toJson from 'enzyme-to-json';
import { FileAttachmentForm } from '../../files/FileAttachmentForm';

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

    test('appPropertiesOnly for new assay', () => {
        const form = mount(
            <AssayDesignerPanels
                initModel={EMPTY_MODEL}
                appPropertiesOnly={true}
                onCancel={jest.fn}
                onComplete={jest.fn}
            />
        );

        expect(toJson(form)).toMatchSnapshot();
        form.unmount();
    });

    test('appPropertiesOnly with initModel', () => {
        const form = mount(
            <AssayDesignerPanels
                initModel={EXISTING_MODEL}
                appPropertiesOnly={true}
                onCancel={jest.fn}
                onComplete={jest.fn}
            />
        );

        expect(toJson(form)).toMatchSnapshot();
        form.unmount();
    });

    test('new assay wizard', () => {
        const component = (
            <AssayDesignerPanels
                initModel={EMPTY_MODEL}
                onCancel={jest.fn}
                onComplete={jest.fn}
            />
        );

        const wrapper = mount(component);
        expect(wrapper.find('.domain-heading-collapsible').hostNodes()).toHaveLength(4);
        expect(wrapper.find('.domain-panel-status-icon').hostNodes()).toHaveLength(3);
        expect(wrapper.find('.fa-exclamation-circle').hostNodes()).toHaveLength(3);
        expect(wrapper.find(NameInput)).toHaveLength(1);
        expect(wrapper.find(DescriptionInput)).toHaveLength(1);
        expect(wrapper.find('.domain-form-no-field-panel').hostNodes()).toHaveLength(2);
        expect(wrapper.find('.domain-form-add-btn').hostNodes()).toHaveLength(2);
        expect(wrapper.find('.domain-form-add-link').hostNodes()).toHaveLength(1);
        expect(wrapper.find(FileAttachmentForm)).toHaveLength(1);
        expect(wrapper.find('.domain-assay-buttons').hostNodes()).toHaveLength(1);
        wrapper.unmount();
    });

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
