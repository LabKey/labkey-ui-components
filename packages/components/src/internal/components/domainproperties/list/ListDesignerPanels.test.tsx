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
    // FIXME: these test cases are disabled for several reasons. They can be re-enabled when:
    //  1. We have a replacement for react-beautiful-dnd that is compatible with our test environment
    //  2. We have a way to inject mock methods for LookupProvider and similar components making network requests
    //  (so, convert these components to use APIWrappers)
    //  3. We have test cases in mind that actually test the ListDesignerPanels, the test cases here don't test anything
    //  that is specific to this component, and we'd be better served with test cases for components lower in the
    //  component tree.
    test('FIXME', () => {});
    // test('new list', () => {
    //     renderWithAppContext(
    //         <MockLookupProvider>
    //             <ListDesignerPanelsImpl
    //                 {...getDefaultProps()}
    //                 currentPanelIndex={0}
    //                 firstState
    //                 onFinish={jest.fn()}
    //                 onTogglePanel={jest.fn()}
    //                 setSubmitting={jest.fn()}
    //                 submitting={false}
    //                 validatePanel={0}
    //                 visitedPanels={List()}
    //             />
    //         </MockLookupProvider>
    //     );
    //
    //     expect(document.querySelectorAll('.domain-field-row').length).toEqual(0);
    // });
    //
    // test('existing list', async () => {
    //     renderWithAppContext(
    //         <MockLookupProvider>
    //             <ListDesignerPanelsImpl
    //                 {...getDefaultProps()}
    //                 initModel={ListModel.create(getDomainDetailsJSON)}
    //                 currentPanelIndex={0}
    //                 firstState
    //                 onFinish={jest.fn()}
    //                 onTogglePanel={jest.fn()}
    //                 setSubmitting={jest.fn()}
    //                 submitting={false}
    //                 validatePanel={0}
    //                 visitedPanels={List()}
    //             />
    //         </MockLookupProvider>
    //     );
    //
    //     await waitFor(() => {
    //         expect(document.querySelectorAll('.domain-field-row').length).toEqual(14);
    //     });
    // });
});
