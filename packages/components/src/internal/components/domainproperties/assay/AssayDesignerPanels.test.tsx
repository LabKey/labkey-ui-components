import React from 'react';
import { List, Map } from 'immutable';

import { act } from '@testing-library/react';

import { userEvent } from '@testing-library/user-event';

import { getDomainPropertiesTestAPIWrapper } from '../APIWrapper';

import { DomainDesign } from '../models';

import { ProductFeature } from '../../../app/constants';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { AssayProtocolModel } from './models';
import { AssayDesignerPanels, AssayDesignerPanelsImpl, AssayDesignerPanelsProps } from './AssayDesignerPanels';

const SERVER_CONTEXT = {
    moduleContext: {
        api: { moduleNames: ['assay', 'study'] },
        core: { productFeatures: [ProductFeature.AssayQC] },
        query: { hasProductProjects: true },
    },
};

const EXISTING_MODEL = AssayProtocolModel.create({
    protocolId: 1,
    name: 'Test Assay Protocol',
    description: 'My assay protocol for you all to use.',
    editableRuns: true,
    allowEditableResults: true,
    editableResults: true,
    allowBackgroundUpload: true,
    allowPlateMetadata: true,
    backgroundUpload: true,
    domains: [
        {
            name: 'Batch Fields',
        },
        {
            name: 'Run Fields',
            fields: [
                {
                    name: 'PlateTemplate',
                    rangeURI: 'xsd:string',
                },
            ],
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

async function setAssayName(value: string) {
    const nameInput = document.querySelector('input#assay-design-name');
    await userEvent.type(nameInput, value);
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
        };
    }

    test('default properties', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
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
                {
                    serverContext: SERVER_CONTEXT,
                }
            ).container;
        });
        expect(container).toMatchSnapshot();
    });

    test('initModel', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
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
                {
                    serverContext: SERVER_CONTEXT,
                }
            ).container;
        });
        expect(container).toMatchSnapshot();
    });

    test('hideEmptyBatchDomain for new assay', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
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
                {
                    serverContext: SERVER_CONTEXT,
                }
            ).container;
        });
        expect(container).toMatchSnapshot();
    });

    test('hideEmptyBatchDomain with initModel', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
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
                {
                    serverContext: SERVER_CONTEXT,
                }
            ).container;
        });
        expect(container).toMatchSnapshot();
    });

    test('appPropertiesOnly for new assay', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
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
                    allowProjectExclusion={true}
                />,
                {
                    serverContext: SERVER_CONTEXT,
                }
            ).container;
        });
        expect(container).toMatchSnapshot();
    });

    test('appPropertiesOnly, allowProjectExclusion false', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
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
                    allowProjectExclusion={false}
                />,
                {
                    serverContext: SERVER_CONTEXT,
                }
            ).container;
        });
        expect(container).toMatchSnapshot();
    });

    test('appPropertiesOnly with initModel', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
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
                    allowProjectExclusion={true}
                />,
                {
                    serverContext: SERVER_CONTEXT,
                }
            ).container;
        });
        expect(container).toMatchSnapshot();
    });

    test('new assay wizard', async () => {
        const component = <AssayDesignerPanels {...getDefaultProps()} />;
        await act(async () => {
            renderWithAppContext(component, {
                serverContext: SERVER_CONTEXT,
            });
        });

        expect(document.querySelectorAll('.domain-heading-collapsible')).toHaveLength(4);
        expect(document.querySelectorAll('.domain-panel-status-icon')).toHaveLength(3);
        expect(document.querySelectorAll('.fa-exclamation-circle')).toHaveLength(3);
        expect(document.querySelectorAll('#assay-design-name')).toHaveLength(1);
        expect(document.querySelectorAll('#assay-design-description')).toHaveLength(1);
        expect(document.querySelectorAll('.domain-form-no-field-panel')).toHaveLength(0);
        expect(document.querySelectorAll('.domain-form-add-btn')).toHaveLength(0);
        expect(document.querySelectorAll('.domain-form-manual-btn')).toHaveLength(3);
        expect(document.querySelectorAll('.file-upload--container')).toHaveLength(3);
        expect(document.querySelectorAll('.form-buttons')).toHaveLength(1);
        expect(document.querySelectorAll('.save-button')).toHaveLength(1);
        expect(document.querySelector('.save-button').getAttribute('disabled')).toBe(null);
    });

    async function validateInferFromFile(model: AssayProtocolModel, shouldInfer: boolean): Promise<void> {
        const component = <AssayDesignerPanels {...getDefaultProps()} initModel={model} />;
        await act(async () => {
            renderWithAppContext(component, {
                serverContext: SERVER_CONTEXT,
            });
        });
        setAssayName('Foo');
        expect(document.querySelectorAll('.file-upload--container')).toHaveLength(1);
        expect(document.querySelector('.file-form-formats').textContent).toContain(
            shouldInfer ? 'include: .csv, .tsv, .txt, .xls, .xlsx, .json' : 'include: .json'
        );
    }

    test('infer from file, data domain', async () => {
        // General assay with Data domain should show infer from files component
        await validateInferFromFile(
            AssayProtocolModel.create({
                providerName: 'General',
                domains: List([DomainDesign.create({ name: 'Data Fields' })]),
            }),
            true
        );
    });
    test('infer from file, non-data domain', async () => {
        // General assay with non-Data domain should not show infer from files component
        await validateInferFromFile(
            AssayProtocolModel.create({
                providerName: 'General',
                domains: List([DomainDesign.create({ name: 'Results Fields' })]),
            }),
            false
        );
    });
    test('infer from file, data domain other', async () => {
        // Other assay with Data domain should not show infer from files component
        await validateInferFromFile(
            AssayProtocolModel.create({
                providerName: 'Other',
                domains: List([DomainDesign.create({ name: 'Data Fields' })]),
            }),
            false
        );
    });

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

        await act(async () => {
            renderWithAppContext(component, {
                serverContext: SERVER_CONTEXT,
            });
        });

        expect(document.querySelectorAll('#' + _appHeaderId)).toHaveLength(1);
        expect(document.querySelector('#' + _appHeaderId).textContent).toBe(_appHeaderText);
    });
});
