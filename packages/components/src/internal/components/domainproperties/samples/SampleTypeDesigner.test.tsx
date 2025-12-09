import React from 'react';
import { List, Map } from 'immutable';

import { userEvent } from '@testing-library/user-event';

import { waitFor } from '@testing-library/dom';

import { DomainDetails } from '../models';

import { getTestAPIWrapper } from '../../../APIWrapper';

import { getEntityTestAPIWrapper } from '../../entities/APIWrapper';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { TEST_LKS_STARTER_MODULE_CONTEXT } from '../../../productFixtures';

import { SampleTypeDesigner, SampleTypeDesignerImpl, SampleTypeDesignerProps } from './SampleTypeDesigner';
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

const BASE_PROPS: SampleTypeDesignerProps = {
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
    currentPanelIndex: 0,
    firstState: true,
    onComplete: jest.fn(),
    onCancel: jest.fn(),
    onFinish: jest.fn(),
    onTogglePanel: jest.fn(),
    setSubmitting: jest.fn(),
    submitting: false,
    validatePanel: 0,
    visitedPanels: List(),
};

describe('SampleTypeDesigner', () => {
    test('default properties', async () => {
        renderWithAppContext(<SampleTypeDesignerImpl {...BASE_PROPS} />, { serverContext: SERVER_CONTEXT });

        await waitFor(() => {
            expect(document.getElementsByClassName('domain-form-panel')).toHaveLength(2);
        });
        const panelTitles = document.querySelectorAll('.domain-panel-title');
        expect(panelTitles[0]).toHaveTextContent('Sample Type Properties');
        expect(panelTitles[1]).toHaveTextContent('Fields');
    });

    test('allowFolderExclusion', async () => {
        renderWithAppContext(<SampleTypeDesignerImpl {...BASE_PROPS} allowFolderExclusion />, {
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
                {...BASE_PROPS}
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
        renderWithAppContext(<SampleTypeDesigner {...BASE_PROPS} />, {
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
        expect(alerts).toHaveLength(0);
    });
});
