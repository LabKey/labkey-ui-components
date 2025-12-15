import React from 'react';
import { List, Map } from 'immutable';

import { userEvent } from '@testing-library/user-event';

import { waitFor } from '@testing-library/dom';

import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';

import { DomainDetails } from '../models';

import { getTestAPIWrapper } from '../../../APIWrapper';

import { getEntityTestAPIWrapper } from '../../entities/APIWrapper';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { TEST_LKS_STARTER_MODULE_CONTEXT } from '../../../productFixtures';

import {
    SampleTypeDesigner,
    SampleTypeDesignerImpl,
    SampleTypeDesignerImplProps,
    SampleTypeDesignerProps,
} from './SampleTypeDesigner';
import { getQueryTestAPIWrapper } from '../../../query/APIWrapper';

const SERVER_CONTEXT = {
    moduleContext: {
        query: { hasProductFolders: true },
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

const DESIGNER_PROPS: SampleTypeDesignerProps = {
    api: getTestAPIWrapper(jest.fn, {
        entity: getEntityTestAPIWrapper(jest.fn, {
            initParentOptionsSelects: jest.fn().mockResolvedValue({
                parentOptions: PARENT_OPTIONS,
                parentAliases: Map(),
            }),
            loadNameExpressionOptions: jest.fn().mockResolvedValue({}),
        }),
        query: getQueryTestAPIWrapper(jest.fn, {
            selectRows: jest.fn().mockResolvedValue({ rows: [] }),
        }),
    }),
    appPropertiesOnly: true,
    onCancel: jest.fn(),
    onComplete: jest.fn(),
};

const DESIGNER_IMPL_PROPS: SampleTypeDesignerImplProps = {
    currentPanelIndex: 0,
    firstState: true,
    onFinish: jest.fn(),
    onTogglePanel: jest.fn(),
    setSubmitting: jest.fn(),
    submitting: false,
    validatePanel: 0,
    visitedPanels: List(),
    ...DESIGNER_PROPS,
};

describe('SampleTypeDesigner', () => {
    test('default properties', async () => {
        renderWithAppContext(<SampleTypeDesignerImpl {...DESIGNER_IMPL_PROPS} />, { serverContext: SERVER_CONTEXT });

        await waitFor(() => {
            expect(document.getElementsByClassName('domain-form-panel')).toHaveLength(2);
        });
        const panelTitles = document.querySelectorAll('.domain-panel-title');
        expect(panelTitles[0]).toHaveTextContent('Sample Type Properties');
        expect(panelTitles[1]).toHaveTextContent('Fields');
    });

    test('allowFolderExclusion', async () => {
        renderWithAppContext(<SampleTypeDesignerImpl {...DESIGNER_IMPL_PROPS} allowFolderExclusion />, {
            serverContext: SERVER_CONTEXT,
        });

        await waitFor(() => {
            expect(document.getElementsByClassName('domain-form-panel')).toHaveLength(3);
        });
        const panelTitles = document.querySelectorAll('.domain-panel-title');
        expect(panelTitles[0]).toHaveTextContent('Sample Type Properties');
        expect(panelTitles[1]).toHaveTextContent('Fields');
        expect(panelTitles[2]).toHaveTextContent('Folders');
    });

    test('initModel with name URL props', async () => {
        const form = (
            <SampleTypeDesignerImpl
                {...DESIGNER_IMPL_PROPS}
                domainFormDisplayOptions={{
                    hideConditionalFormatting: true,
                }}
                initModel={DomainDetails.create(
                    Map<string, any>({
                        domainDesign: {
                            name: 'Test Name',
                            // Note: we can't initialize the test with fields because react-beautiful-dnd will cause an
                            // error
                            // fields: [{ name: 'testfield' }],
                        },
                        nameReadOnly: true,
                    })
                )}
            />
        );
        renderWithAppContext(form, { serverContext: SERVER_CONTEXT });

        await waitFor(() => {
            expect(document.querySelectorAll('.domain-form-panel')).toHaveLength(2);
        });
        const panelTitles = document.querySelectorAll('.domain-panel-title');
        expect(panelTitles[0]).toHaveTextContent('Sample Type Properties');
        expect(panelTitles[1]).toHaveTextContent('Fields');
        expect(document.getElementsByClassName('translator--toggle__wizard')).toHaveLength(1);
    });

    test('open fields panel, with barcodes', async () => {
        // NOTE: Here we are calling the full designer, SampleTypeDesigner, not the SampleTypeDesignerImpl
        renderWithAppContext(<SampleTypeDesigner {...DESIGNER_PROPS} />, {
            serverContext: {
                moduleContext: {
                    ...TEST_LKS_STARTER_MODULE_CONTEXT,
                    query: { hasProductFolders: true },
                },
            },
        });

        await waitFor(() => {
            expect(document.querySelectorAll('.domain-form-panel')).toHaveLength(2);
        });
        const panelHeader = document.querySelector('div#domain-header');
        await userEvent.click(panelHeader);
        const alerts = document.getElementsByClassName('alert');
        // still expect to have only two alerts.  We don't show the Barcode header in the file import panel.
        // Jest doesn't want to switch to that panel.
        expect(alerts[0]).toHaveTextContent(PROPERTIES_PANEL_ERROR_MSG);
        expect(alerts[1]).toHaveTextContent('Please correct errors in the properties panel before saving.');
    });
});
