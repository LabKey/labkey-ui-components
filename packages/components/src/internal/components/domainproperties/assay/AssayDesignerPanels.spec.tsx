import React from 'react';
import { List, Map } from 'immutable';
import { Panel } from 'react-bootstrap';
import { getDomainPropertiesTestAPIWrapper } from '../APIWrapper';

import { DomainDesign } from '../models';

import {
    mountWithAppServerContext,
    mountWithServerContext,
    shallowWithServerContext,
    waitForLifecycle,
} from '../../../test/enzymeTestHelpers';

import { FileAttachmentForm } from '../../../../public/files/FileAttachmentForm';

import { ProductFeature } from '../../../app/constants';

import DomainForm from '../DomainForm';

import { AssayProtocolModel } from './models';
import { DescriptionInput, NameInput } from './AssayPropertiesInput';
import { AssayDesignerPanels, AssayDesignerPanelsImpl, AssayDesignerPanelsProps } from './AssayDesignerPanels';

const SERVER_CONTEXT = {
    moduleContext: { api: { moduleNames: ['assay', 'study'] }, core: { productFeatures: [ProductFeature.AssayQC] } },
};

const EXISTING_MODEL = AssayProtocolModel.create({
    protocolId: 1,
    name: 'Test Assay Protocol',
    description: 'My assay protocol for you all to use.',
    editableRuns: true,
    allowEditableResults: true,
    editableResults: true,
    allowBackgroundUpload: true,
    backgroundUpload: true,
    domains: [
        {
            name: 'Batch Fields',
        },
        {
            name: 'Sample Fields',
            fields: [
                {
                    name: 'field1',
                    rangeURI: 'xsd:string',
                },
                {
                    name: 'field2',
                    rangeURI: 'xsd:int',
                },
                {
                    name: 'field3',
                    rangeURI: 'xsd:dateTime',
                },
            ],
        },
    ],
});

const EMPTY_MODEL = AssayProtocolModel.create({
    providerName: 'General',
    domains: List([
        DomainDesign.create({ name: 'Batch Fields' }),
        DomainDesign.create({ name: 'Run Fields' }),
        DomainDesign.create({ name: 'Data Fields' }),
    ]),
});

const nameInputId = 'assay-design-name';
function setAssayName(wrapper: any, value: string) {
    const nameInputValue = { id: nameInputId, value };
    wrapper
        .find('input#' + nameInputId)
        .simulate('focus')
        .simulate('change', { target: nameInputValue });
}

describe('AssayDesignerPanels', () => {
    function getDefaultProps(): AssayDesignerPanelsProps {
        return {
            api: getDomainPropertiesTestAPIWrapper(jest.fn),
            domainFormDisplayOptions: {
                hideStudyPropertyTypes: true,
            },
            initModel: EMPTY_MODEL,
            onComplete: jest.fn(),
            onCancel: jest.fn(),
            testMode: true,
        };
    }

    test('default properties', async () => {
        const wrapper = shallowWithServerContext(
            <AssayDesignerPanelsImpl
                {...getDefaultProps()}
                currentPanelIndex={0}
                firstState={true}
                onFinish={jest.fn()}
                onTogglePanel={jest.fn()}
                setSubmitting={jest.fn()}
                submitting={false}
                validatePanel={0}
                visitedPanels={List()}
            />,
            SERVER_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper).toMatchSnapshot();
        wrapper.unmount();
    });

    test('initModel', async () => {
        const wrapper = shallowWithServerContext(
            <AssayDesignerPanelsImpl
                {...getDefaultProps()}
                initModel={EXISTING_MODEL}
                currentPanelIndex={0}
                firstState={true}
                onFinish={jest.fn()}
                onTogglePanel={jest.fn()}
                setSubmitting={jest.fn()}
                submitting={false}
                validatePanel={0}
                visitedPanels={List()}
            />,
            SERVER_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper).toMatchSnapshot();
        wrapper.unmount();
    });

    test('hideEmptyBatchDomain for new assay', async () => {
        const wrapper = shallowWithServerContext(
            <AssayDesignerPanelsImpl
                {...getDefaultProps()}
                hideEmptyBatchDomain
                currentPanelIndex={0}
                firstState={true}
                onFinish={jest.fn()}
                onTogglePanel={jest.fn()}
                setSubmitting={jest.fn()}
                submitting={false}
                validatePanel={0}
                visitedPanels={List()}
            />,
            SERVER_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper).toMatchSnapshot();
        wrapper.unmount();
    });

    test('hideEmptyBatchDomain with initModel', async () => {
        const wrapper = shallowWithServerContext(
            <AssayDesignerPanelsImpl
                {...getDefaultProps()}
                initModel={EXISTING_MODEL}
                hideEmptyBatchDomain
                currentPanelIndex={0}
                firstState={true}
                onFinish={jest.fn()}
                onTogglePanel={jest.fn()}
                setSubmitting={jest.fn()}
                submitting={false}
                validatePanel={0}
                visitedPanels={List()}
            />,
            SERVER_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper).toMatchSnapshot();
        wrapper.unmount();
    });

    test('appPropertiesOnly for new assay', async () => {
        const wrapper = shallowWithServerContext(
            <AssayDesignerPanelsImpl
                {...getDefaultProps()}
                appPropertiesOnly
                currentPanelIndex={0}
                firstState={true}
                onFinish={jest.fn()}
                onTogglePanel={jest.fn()}
                setSubmitting={jest.fn()}
                submitting={false}
                validatePanel={0}
                visitedPanels={List()}
            />,
            SERVER_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper).toMatchSnapshot();
        wrapper.unmount();
    });

    test('appPropertiesOnly with initModel', async () => {
        const wrapper = shallowWithServerContext(
            <AssayDesignerPanelsImpl
                {...getDefaultProps()}
                initModel={EXISTING_MODEL}
                appPropertiesOnly
                currentPanelIndex={0}
                firstState={true}
                onFinish={jest.fn()}
                onTogglePanel={jest.fn()}
                setSubmitting={jest.fn()}
                submitting={false}
                validatePanel={0}
                visitedPanels={List()}
            />,
            SERVER_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper).toMatchSnapshot();
        wrapper.unmount();
    });

    test('hideFilePropertyType with initModel', async () => {
        const props = {
            ...getDefaultProps(),
            domainFormDisplayOptions: {
                hideStudyPropertyTypes: true,
                hideFilePropertyType: true,
            },
        };
        const wrapper = shallowWithServerContext(
            <AssayDesignerPanelsImpl
                {...props}
                initModel={EXISTING_MODEL}
                appPropertiesOnly
                currentPanelIndex={0}
                firstState={true}
                onFinish={jest.fn()}
                onTogglePanel={jest.fn()}
                setSubmitting={jest.fn()}
                submitting={false}
                validatePanel={0}
                visitedPanels={List()}
            />,
            SERVER_CONTEXT
        );

        await waitForLifecycle(wrapper);
        const forms = wrapper.find(DomainForm);
        expect(forms).toHaveLength(2);
        expect(forms.at(1).prop('domainFormDisplayOptions')).toStrictEqual({
            hideStudyPropertyTypes: true,
            hideFilePropertyType: true,
            domainKindDisplayName: 'assay design',
            hideInferFromFile: true,
            textChoiceLockedForDomain: true,
        });
    });

    test('new assay wizard', async () => {
        const component = <AssayDesignerPanels {...getDefaultProps()} />;
        const wrapper = mountWithAppServerContext(component);
        await waitForLifecycle(wrapper);

        expect(wrapper.find('.domain-heading-collapsible').hostNodes()).toHaveLength(4);
        expect(wrapper.find('.domain-panel-status-icon').hostNodes()).toHaveLength(3);
        expect(wrapper.find('.fa-exclamation-circle').hostNodes()).toHaveLength(3);
        expect(wrapper.find(NameInput)).toHaveLength(1);
        expect(wrapper.find(DescriptionInput)).toHaveLength(1);
        expect(wrapper.find('.domain-form-no-field-panel').hostNodes()).toHaveLength(0);
        expect(wrapper.find('.domain-form-add-btn').hostNodes()).toHaveLength(0);
        expect(wrapper.find('.domain-form-manual-btn').hostNodes()).toHaveLength(3);
        expect(wrapper.find(FileAttachmentForm)).toHaveLength(3);
        expect(wrapper.find('.domain-designer-buttons').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.btn-success')).toHaveLength(1);
        expect(wrapper.find('.btn-success').props().disabled).toBe(false);
        wrapper.unmount();
    });

    test('infer from file', async () => {
        async function validateInferFromFile(model: AssayProtocolModel, shouldInfer: boolean): Promise<void> {
            const component = <AssayDesignerPanels {...getDefaultProps()} initModel={model} />;
            const wrapper = mountWithServerContext(component);
            await waitForLifecycle(wrapper);
            setAssayName(wrapper, 'Foo');
            expect(wrapper.find(FileAttachmentForm)).toHaveLength(1);
            expect(wrapper.find('.file-form-formats').text()).toContain(
                shouldInfer ? 'include: .csv, .tsv, .txt, .xls, .xlsx, .json' : 'include: .json'
            );
            wrapper.unmount();
        }

        // General assay with Data domain should show infer from files component
        await validateInferFromFile(
            AssayProtocolModel.create({
                providerName: 'General',
                domains: List([DomainDesign.create({ name: 'Data Fields' })]),
            }),
            true
        );

        // General assay with non-Data domain should not show infer from files component
        await validateInferFromFile(
            AssayProtocolModel.create({
                providerName: 'General',
                domains: List([DomainDesign.create({ name: 'Results Fields' })]),
            }),
            false
        );

        // Other assay with Data domain should not show infer from files component
        await validateInferFromFile(
            AssayProtocolModel.create({
                providerName: 'Other',
                domains: List([DomainDesign.create({ name: 'Data Fields' })]),
            }),
            false
        );
    });

    // FIXME: This test case triggers issues with React Beautiful DND, I think there is a way to put that library in
    //  test mode. We maybe accidentally disabled that in the test stabilization PR.
    test('Show app headers', async () => {
        const _appHeaderId = 'mock-app-header';
        const _appHeaderText = 'This is a mock app header';

        const mockAppHeader = jest.fn();
        mockAppHeader.mockReturnValue(
            <>
                <div id={_appHeaderId}>{_appHeaderText}</div>
            </>
        );

        const component = (
            <AssayDesignerPanels
                {...getDefaultProps()}
                initModel={EXISTING_MODEL}
                appDomainHeaders={Map({ Sample: mockAppHeader })}
            />
        );

        const wrapper = mountWithServerContext(component);
        await waitForLifecycle(wrapper);

        // Open Sample Fields panel body
        wrapper
            .find('.panel-heading')
            .filterWhere(n => n.text().indexOf('Sample Fields') === 0)
            .simulate('click');
        expect(wrapper.find('#' + _appHeaderId)).toHaveLength(1);
        expect(wrapper.find('#' + _appHeaderId).text()).toBe(_appHeaderText);
        wrapper.unmount();
    });
});
