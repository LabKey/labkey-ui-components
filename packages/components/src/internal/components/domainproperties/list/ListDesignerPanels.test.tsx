import React from 'react';

import { List } from 'immutable';

import { waitFor } from '@testing-library/dom';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { DEFAULT_LIST_SETTINGS } from '../../../../test/data/constants';
import getDomainDetailsJSON from '../../../../test/data/list-getDomainDetails.json';

import { getTestAPIWrapper } from '../../../APIWrapper';

import { MockLookupProvider } from '../../../../test/MockLookupProvider';

import { createMockSelectRowsDeprecatedResponse, createMockSelectRowsResponse } from '../../../../test/MockUtils';

import { ListModel } from './models';
import { ListDesignerPanelsProps, ListDesignerPanelsImpl } from './ListDesignerPanels';

jest.mock('../actions', () => ({
    ...jest.requireActual('../actions'),
    fetchQueries: jest.fn().mockResolvedValue([]),
    fetchContainers: jest.fn().mockResolvedValue(List()),
}));

jest.mock('../../../query/selectRows', () => ({
    ...jest.requireActual('../../../query/selectRows'),
    selectRows: () => createMockSelectRowsResponse(),
}));

jest.mock('../../../query/api', () => ({
    ...jest.requireActual('../../../query/api'),
    selectRowsDeprecated: () => createMockSelectRowsDeprecatedResponse(),
}));

describe('ListDesignerPanels', () => {
    function getDefaultProps(): ListDesignerPanelsProps {
        return {
            api: getTestAPIWrapper(jest.fn),
            initModel: ListModel.create(null, DEFAULT_LIST_SETTINGS),
            onCancel: jest.fn(),
            onChange: jest.fn(),
            onComplete: jest.fn(),
        };
    }

    test('new list', async () => {
        renderWithAppContext(
            <MockLookupProvider>
                <ListDesignerPanelsImpl
                    {...getDefaultProps()}
                    currentPanelIndex={0}
                    firstState
                    onFinish={jest.fn()}
                    onTogglePanel={jest.fn()}
                    setSubmitting={jest.fn()}
                    submitting={false}
                    validatePanel={0}
                    visitedPanels={List()}
                />
            </MockLookupProvider>
        );

        await waitFor(() => {
            expect(document.querySelectorAll('.domain-field-row').length).toEqual(0);
        });
    });

    test('existing list', async () => {
        renderWithAppContext(
            <MockLookupProvider>
                <ListDesignerPanelsImpl
                    {...getDefaultProps()}
                    initModel={ListModel.create(getDomainDetailsJSON)}
                    currentPanelIndex={0}
                    firstState
                    onFinish={jest.fn()}
                    onTogglePanel={jest.fn()}
                    setSubmitting={jest.fn()}
                    submitting={false}
                    validatePanel={0}
                    visitedPanels={List()}
                />
            </MockLookupProvider>
        );

        await waitFor(() => {
            expect(document.querySelectorAll('.domain-field-row').length).toEqual(14);
        });
    });
});
