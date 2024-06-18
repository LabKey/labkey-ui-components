import React from 'react';
import { List, Map } from 'immutable';
import { shallow } from 'enzyme';

import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';
import DomainForm from '../DomainForm';

import { DomainDetails } from '../models';

import { mountWithAppServerContext, waitForLifecycle } from '../../../test/enzymeTestHelpers';

import { FileAttachmentForm } from '../../../../public/files/FileAttachmentForm';

import { Alert } from '../../base/Alert';

import { getTestAPIWrapper } from '../../../APIWrapper';

import { getEntityTestAPIWrapper } from '../../entities/APIWrapper';

import { SampleTypePropertiesPanel } from './SampleTypePropertiesPanel';
import { SampleTypeDesigner, SampleTypeDesignerImpl } from './SampleTypeDesigner';
import { act } from '@testing-library/react';
import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';
import userEvent from '@testing-library/user-event';


const SERVER_CONTEXT = {
    moduleContext: {
        query: { hasProductProjects: true}
    },
};

const PARENT_OPTIONS = [
    {
        label: '(Current Sample Type)',
        schema: 'samples',
        value: '{{this_sample_set}}',
    },
    {
        label: 'Fruits',
        query: 'Fruits',
        schema: 'samples',
        value: 'materialInputs/Fruits',
    },
    {
        label: 'Name Expression Set',
        query: 'Name Expression Set',
        schema: 'samples',
        value: 'materialInputs/Name Expression Set',
    },
    {
        label: 'Sample Set 2',
        query: 'Sample Set 2',
        schema: 'samples',
        value: 'materialInputs/Sample Set 2',
    },
    {
        label: 'Sample Set Error',
        query: 'Sample Set Error',
        schema: 'samples',
        value: 'materialInputs/Sample Set Error',
    },
];

const BASE_PROPS = {
    appPropertiesOnly: true,
    initModel: undefined,
    onComplete: jest.fn(),
    onCancel: jest.fn(),
    testMode: true,
    api: getTestAPIWrapper(jest.fn, {
        entity: getEntityTestAPIWrapper(jest.fn, {
            initParentOptionsSelects: () =>
                Promise.resolve({
                    parentOptions: PARENT_OPTIONS,
                    parentAliases: Map(),
                }),
        }),
    }),
};

describe('SampleTypeDesigner', () => {
    afterEach(() => {
        document.getElementsByTagName('html')[0].innerHTML = '';
    });

    test('default properties', async () => {
        const form = (
            <SampleTypeDesignerImpl
                {...BASE_PROPS}
                currentPanelIndex={0}
                firstState={true}
                onFinish={jest.fn()}
                onTogglePanel={jest.fn()}
                setSubmitting={jest.fn()}
                submitting={false}
                validatePanel={0}
                visitedPanels={List()}
            />
        );

        await act(async () => {
            renderWithAppContext(form, {
                serverContext: SERVER_CONTEXT,
            })
        });

        expect(document.getElementsByClassName('domain-form-panel')).toHaveLength(2);
        const panelTitles = document.querySelectorAll('.domain-panel-title');
        expect(panelTitles[0].textContent).toBe('Sample Type Properties');
        expect(panelTitles[1].textContent).toBe('Fields');
    });

    test('allowProjectExclusion', async () => {
        const form = (
            <SampleTypeDesignerImpl
                {...BASE_PROPS}
                currentPanelIndex={0}
                firstState={true}
                onFinish={jest.fn()}
                onTogglePanel={jest.fn()}
                setSubmitting={jest.fn()}
                submitting={false}
                validatePanel={0}
                visitedPanels={List()}
                allowProjectExclusion
            />
        );

        await act(async () => {
            renderWithAppContext(form, {
                serverContext: SERVER_CONTEXT,
            })
        });

        expect(document.getElementsByClassName('domain-form-panel')).toHaveLength(3);
        const panelTitles = document.querySelectorAll('.domain-panel-title');
        expect(panelTitles[0].textContent).toBe('Sample Type Properties');
        expect(panelTitles[1].textContent).toBe('Fields');
        expect(panelTitles[2].textContent).toBe('Projects');
    });

    test('initModel with name URL props', async () => {
        const form = (
            <SampleTypeDesignerImpl
                {...BASE_PROPS}
                domainFormDisplayOptions={{
                    hideConditionalFormatting: true,
                }}
                initModel={DomainDetails.create(
                    Map<string, any>({
                        domainDesign: {
                            name: 'Test Name',
                            fields: [{ name: 'testfield' }],
                        },
                        nameReadOnly: true,
                    })
                )}
                currentPanelIndex={0}
                firstState={true}
                onFinish={jest.fn()}
                onTogglePanel={jest.fn()}
                setSubmitting={jest.fn()}
                submitting={false}
                validatePanel={0}
                visitedPanels={List()}
            />
        );
        await act(async () => {
            renderWithAppContext(form, {
                serverContext: SERVER_CONTEXT,
            })
        });

        //expect(wrapped.find(SampleTypePropertiesPanel)).toHaveLength(1);
        const panels = document.querySelectorAll('.domain-form-panel');
        expect(panels).toHaveLength(2);
        const panelTitles = document.querySelectorAll('.domain-panel-title');
        expect(panelTitles[0].textContent).toBe('Sample Type Properties');
        expect(panelTitles[1].textContent).toBe('Fields');
        expect(document.getElementsByClassName('translator--toggle__wizard')).toHaveLength(0);
    });

    test('open fields panel', async () => {
        await act(async () => {
            renderWithAppContext(<SampleTypeDesigner {...BASE_PROPS} />, {
                serverContext: SERVER_CONTEXT,
            })
        });

        const panelHeader = document.querySelector('div#domain-header');
        expect(panelHeader.getAttribute('class')).toContain('domain-panel-header-collapsed');
        userEvent.click(panelHeader);
        expect(document.querySelector('#domain-header').getAttribute('class')).toContain('domain-panel-header-expanded');
        expect(document.getElementsByClassName('translator--toggle__wizard')).toHaveLength(1);

        const alerts = document.getElementsByClassName('alert');
        expect(alerts).toHaveLength(2);
        expect(alerts[0].textContent).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(alerts[1].textContent).toEqual('Please correct errors in the properties panel before saving.');
    });

    test('open fields panel, with barcodes', async () => {
        LABKEY.moduleContext = { api: { moduleNames: ['samplemanagement', 'api', 'core', 'premium'] } };
        await act(async () => {
            renderWithAppContext(<SampleTypeDesigner {...BASE_PROPS} />, {
                serverContext: SERVER_CONTEXT,
            })
        });

        const panelHeader = document.querySelector('div#domain-header');
        userEvent.click(panelHeader);
        const alerts = document.getElementsByClassName('alert');
        // still expect to have only two alerts.  We don't show the Barcode header in the file import panel.
        // Jest doesn't want to switch to that panel.
        expect(alerts).toHaveLength(2);
        expect(alerts[0].textContent).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(alerts[1].textContent).toEqual('Please correct errors in the properties panel before saving.');
    });
});