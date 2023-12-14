import React from 'react';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { List } from 'immutable';

import { getTestAPIWrapper } from '../../../APIWrapper';
import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';
import getDomainDetailsJSON from '../../../../test/data/dataclass-getDomainDetails.json';

import { DataClassModel } from './models';
import { DataClassDesigner, DataClassDesignerImpl } from './DataClassDesigner';

const BASE_PROPS = {
    api: getTestAPIWrapper(jest.fn),
    onComplete: jest.fn(),
    onCancel: jest.fn(),
    loadNameExpressionOptions: jest.fn(async () => ({ prefix: '', allowUserSpecifiedNames: true })),
    testMode: true,
};

describe('DataClassDesigner', () => {
    test('default properties', async () => {
        const component = (
            <DataClassDesignerImpl
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
            const { container } = renderWithAppContext(component);
            expect(container).toMatchSnapshot();
        });

        expect(document.querySelectorAll('#dataclass-properties-hdr').length).toBe(1);
        expect(document.querySelectorAll('.domain-form-panel').length).toBe(2);
        expect(screen.getByText('Import or infer fields from file')).toBeInTheDocument();
    });

    test('custom properties', async () => {
        const component = (
            <DataClassDesignerImpl
                {...BASE_PROPS}
                nounSingular="Source"
                nounPlural="Sources"
                nameExpressionInfoUrl="https://www.labkey.org/Documentation"
                nameExpressionPlaceholder="name expression placeholder test"
                headerText="header text test"
                appPropertiesOnly={true}
                saveBtnText="Finish it up"
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
            const { container } = renderWithAppContext(component);
            expect(container).toMatchSnapshot();
        });

        expect(document.querySelectorAll('#dataclass-properties-hdr').length).toBe(1);
        expect(document.querySelectorAll('.domain-form-panel').length).toBe(2);
        expect(screen.getByText('Import or infer fields from file')).toBeInTheDocument();
    });

    test('initModel', async () => {
        const component = (
            <DataClassDesignerImpl
                {...BASE_PROPS}
                initModel={DataClassModel.create(getDomainDetailsJSON)}
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
            const { container } = renderWithAppContext(component);
            expect(container).toMatchSnapshot();
        });

        expect(document.querySelectorAll('#dataclass-properties-hdr').length).toBe(1);
        expect(document.querySelectorAll('.domain-form-panel').length).toBe(2);
        expect(screen.queryByText('Import or infer fields from file')).not.toBeInTheDocument();
    });

    test('open fields panel', async () => {
        const component = <DataClassDesigner {...BASE_PROPS} />;
        await act(async () => {
            renderWithAppContext(component);
        });

        let panelHeader = document.querySelector('div#domain-header');
        expect(panelHeader?.classList.contains('domain-panel-header-collapsed')).toBeTruthy();
        expect(panelHeader?.classList.contains('domain-panel-header-expanded')).toBeFalsy();
        userEvent.click(panelHeader);

        panelHeader = document.querySelector('div#domain-header');
        expect(panelHeader?.classList.contains('domain-panel-header-collapsed')).toBeFalsy();
        expect(panelHeader?.classList.contains('domain-panel-header-expanded')).toBeTruthy();
        expect(screen.queryByText('Import or infer fields from file')).toBeInTheDocument();
        expect(document.querySelectorAll('.domain-system-fields').length).toBe(1);

        expect(document.querySelectorAll('.alert').length).toBe(2);
        expect(screen.queryByText(PROPERTIES_PANEL_ERROR_MSG)).toBeInTheDocument();
        expect(screen.queryByText('Please correct errors in the properties panel before saving.')).toBeInTheDocument();
    });
});
