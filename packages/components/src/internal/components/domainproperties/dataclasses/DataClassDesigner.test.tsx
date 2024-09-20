import React from 'react';
import { act, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { List } from 'immutable';

import { getTestAPIWrapper } from '../../../APIWrapper';
import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';
import getDomainDetailsJSON from '../../../../test/data/dataclass-getDomainDetails.json';

import { DataClassModel } from './models';
import { DataClassDesigner, DataClassDesignerImpl, DataClassDesignerProps } from './DataClassDesigner';

describe('DataClassDesigner', () => {
    const BASE_PROPS: DataClassDesignerProps = {
        api: getTestAPIWrapper(jest.fn),
        currentPanelIndex: 0,
        firstState: true,
        loadNameExpressionOptions: jest.fn().mockResolvedValue({ allowUserSpecifiedNames: true, prefix: '' }),
        onCancel: jest.fn(),
        onComplete: jest.fn(),
        onFinish: jest.fn(),
        onTogglePanel: jest.fn(),
        setSubmitting: jest.fn(),
        submitting: false,
        validatePanel: 0,
        visitedPanels: List(),
    };

    const SERVER_CONTEXT = {
        moduleContext: {
            query: { hasProductProjects: true },
        },
    };

    // FIXME: these test cases are disabled for several reasons. They can be re-enabled when:
    //  1. We have a replacement for react-beautiful-dnd that is compatible with our test environment
    //  2. We have a way to inject mock methods for LookupProvider and similar components making network requests
    //  (so, convert these components to use APIWrappers)
    test('FIXME', () => {});

    // test('default properties', async () => {
    //     const component = <DataClassDesignerImpl {...BASE_PROPS} />;
    //     await act(async () => {
    //         renderWithAppContext(component, {
    //             serverContext: SERVER_CONTEXT,
    //         });
    //     });
    //
    //     expect(document.querySelectorAll('#dataclass-properties-hdr').length).toBe(1);
    //     expect(document.querySelectorAll('.domain-form-panel').length).toBe(2);
    //     expect(screen.getByText('Import or infer fields from file')).toBeInTheDocument();
    // });
    //
    // test('custom properties', async () => {
    //     const component = (
    //         <DataClassDesignerImpl
    //             {...BASE_PROPS}
    //             appPropertiesOnly
    //             headerText="header text test"
    //             nameExpressionInfoUrl="https://www.labkey.org/Documentation"
    //             nameExpressionPlaceholder="name expression placeholder test"
    //             nounPlural="Sources"
    //             nounSingular="Source"
    //             saveBtnText="Finish it up"
    //         />
    //     );
    //     await act(async () => {
    //         renderWithAppContext(component, {
    //             serverContext: SERVER_CONTEXT,
    //         });
    //     });
    //     expect(document.querySelectorAll('#dataclass-properties-hdr').length).toBe(1);
    //     expect(document.querySelectorAll('.domain-form-panel').length).toBe(2);
    //     expect(screen.getByText('Import or infer fields from file')).toBeInTheDocument();
    //     expect(document.querySelectorAll('#domain-folders-hdr').length).toBe(0);
    // });
    //
    // test('initModel', async () => {
    //     const component = (
    //         <DataClassDesignerImpl {...BASE_PROPS} initModel={DataClassModel.create(getDomainDetailsJSON)} />
    //     );
    //     await act(async () => {
    //         renderWithAppContext(component, {
    //             serverContext: SERVER_CONTEXT,
    //         });
    //     });
    //
    //     expect(document.querySelectorAll('#dataclass-properties-hdr').length).toBe(1);
    //     expect(document.querySelectorAll('.domain-form-panel').length).toBe(2);
    //     expect(screen.queryByText('Import or infer fields from file')).not.toBeInTheDocument();
    // });
    //
    // test('appPropertiesOnly and allowFolderExclusion', async () => {
    //     const component = (
    //         <DataClassDesignerImpl
    //             {...BASE_PROPS}
    //             allowFolderExclusion
    //             appPropertiesOnly
    //             initModel={DataClassModel.create(getDomainDetailsJSON)}
    //         />
    //     );
    //     await act(async () => {
    //         renderWithAppContext(component, { serverContext: SERVER_CONTEXT });
    //     });
    //
    //     expect(document.querySelectorAll('#dataclass-properties-hdr').length).toBe(1);
    //     expect(document.querySelectorAll('.domain-form-panel').length).toBe(3);
    //     expect(screen.queryByText('Import or infer fields from file')).not.toBeInTheDocument();
    //     expect(document.querySelectorAll('#domain-folders-hdr').length).toBe(1);
    // });
});
