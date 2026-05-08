import React from 'react';
import { getTestAPIWrapper } from '../../APIWrapper';

import { Container } from '../base/models/Container';

import { getLabelPrintingTestAPIWrapper } from './APIWrapper';

import { BarTenderSettingsForm, BarTenderSettingsFormProps } from './BarTenderSettingsForm';
import { BarTenderConfiguration } from './models';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { waitFor } from '@testing-library/dom';
import { userEvent } from '@testing-library/user-event';
import { AppContextTestProviderProps } from '../../test/testHelpers';
import { TEST_FOLDER_CONTAINER } from '../../containerFixtures';

describe('BarTenderSettingsForm', () => {
    function defaultContext(): AppContextTestProviderProps {
        return {
            appContext: {
                api: getTestAPIWrapper(jest.fn, {
                    labelprinting: getLabelPrintingTestAPIWrapper(jest.fn),
                }),
            },
        };
    }

    function defaultProps(): BarTenderSettingsFormProps {
        return {
            container: TEST_FOLDER_CONTAINER,
            getIsDirty: jest.fn(),
            onChange: jest.fn(),
            onSuccess: jest.fn(),
            setIsDirty: jest.fn(),
        };
    }

    function validate(withHeading = true): void {
        expect(document.querySelectorAll('.panel-heading')).toHaveLength(withHeading ? 1 : 0);
        expect(document.querySelectorAll('.permissions-save-alert')).toHaveLength(0);
        expect(document.querySelectorAll('.label-printing--help-link')).toHaveLength(1);
    }

    function validateButtons(canTest?: boolean, canSave?: boolean, canAdd = true): void {
        const buttons = document.querySelectorAll('button');
        expect(buttons).toHaveLength(canTest || canSave || canAdd ? 2 : 1);
        const button = buttons.item(0);
        if (canTest) {
            expect(button).toHaveTextContent('Test Connection');
            expect(button).not.toBeDisabled();
        } else {
            expect(button).toHaveTextContent('Save');

            if (canSave) {
                expect(button).not.toBeDisabled();
            } else {
                expect(button).toBeDisabled();
            }
        }
        if (canAdd) {
            expect(buttons.item(1).textContent).toBe(' Add New Label Template');
        }
    }

    test('default props, home project', async () => {
        renderWithAppContext(
            <BarTenderSettingsForm {...defaultProps()} container={new Container({ path: '/Test' })} />,
            defaultContext()
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.label-templates-container')).toHaveLength(1);
        });
        validate();
        validateButtons(false, false);
    });

    test('default props, product folder', async () => {
        renderWithAppContext(<BarTenderSettingsForm {...defaultProps()} />, {
            ...defaultContext(),
            serverContext: {
                moduleContext: { query: { isProductFoldersEnabled: true } },
            },
        });

        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner')).toHaveLength(0);
        });

        expect(document.querySelectorAll('.label-templates-container')).toHaveLength(0);
        expect(document.querySelector('input').getAttribute('type')).toBe('url');
        validate(true);
        validateButtons(false, false, false);
    });

    test('default props, subfolder without folders', async () => {
        renderWithAppContext(<BarTenderSettingsForm {...defaultProps()} />, {
            ...defaultContext(),
            serverContext: {
                moduleContext: {
                    query: { isProductFoldersEnabled: false },
                },
            },
        });

        await waitFor(() => {
            expect(document.querySelectorAll('.label-templates-container')).toHaveLength(1);
        });

        validate();
        validateButtons(false, false);
    });

    test('with initial form values', async () => {
        renderWithAppContext(<BarTenderSettingsForm {...defaultProps()} />, {
            appContext: {
                api: getTestAPIWrapper(jest.fn, {
                    labelprinting: getLabelPrintingTestAPIWrapper(jest.fn, {
                        fetchBarTenderConfiguration: jest
                            .fn()
                            .mockResolvedValue(new BarTenderConfiguration({ serviceURL: 'testServerURL' })),
                    }),
                }),
            },
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.label-templates-container')).toHaveLength(1);
        });
        validate();
        validateButtons(true, false);

        const urlInput = document.querySelector('input');
        expect(urlInput.getAttribute('value')).toBe('testServerURL');
        await userEvent.click(urlInput);
        await userEvent.paste('changeURL');
        validateButtons(false, true);
    });
});
