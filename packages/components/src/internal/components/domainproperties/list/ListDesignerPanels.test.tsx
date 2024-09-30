import React from 'react';

import { List } from 'immutable';

import { waitFor } from '@testing-library/dom';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { DEFAULT_LIST_SETTINGS } from '../../../../test/data/constants';
import getDomainDetailsJSON from '../../../../test/data/list-getDomainDetails.json';

import { getTestAPIWrapper } from '../../../APIWrapper';

import { MockLookupProvider } from '../../../../test/components/Lookup';

import { ListModel } from './models';
import { ListDesignerPanelsProps, ListDesignerPanelsImpl } from './ListDesignerPanels';

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
