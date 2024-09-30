import React from 'react';
import { getTestAPIWrapper } from '../../APIWrapper';

import { Container } from '../base/models/Container';

import { getLabelPrintingTestAPIWrapper } from './APIWrapper';

import { BarTenderSettingsForm } from './BarTenderSettingsForm';
import { BarTenderConfiguration } from './models';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { waitFor } from '@testing-library/dom';
import { userEvent } from '@testing-library/user-event';

describe('BarTenderSettingsForm', () => {
    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn, {
            labelprinting: getLabelPrintingTestAPIWrapper(jest.fn),
        }),
        canPrintLabels: false,
        printServiceUrl: '',
        onChange: jest.fn(),
        onSuccess: jest.fn(),
        getIsDirty: jest.fn(),
        setIsDirty: jest.fn(),
        defaultLabel: 1,
    };

    function validate(withHeading = true): void {
        expect(document.querySelectorAll('.panel-heading')).toHaveLength(withHeading ? 1 : 0);
        expect(document.querySelectorAll('.permissions-save-alert')).toHaveLength(0);
        expect(document.querySelectorAll('.label-printing--help-link')).toHaveLength(1);
    }

    function validateButtons(canTest?: boolean, canSave?: boolean): void {
        const buttons = document.querySelectorAll('button');
        expect(buttons).toHaveLength(1);
        const button = buttons.item(0);
        if (canTest) {
            expect(button.textContent).toBe('Test Connection');
            expect(button.getAttribute('disabled')).toBeNull();
        } else {
            expect(button.textContent).toBe('Save');

            if (canSave) {
                expect(button.getAttribute('disabled')).toBeNull();
            } else {
                expect(button.getAttribute('disabled')).toBeDefined();
            }
        }
    }

    test('default props, home project', async () => {
        renderWithAppContext(
            <BarTenderSettingsForm {...DEFAULT_PROPS} container={new Container({ path: '/Test' })} />
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.label-templates-container')).toHaveLength(1);
        });
        validate();
        validateButtons(false, false);
    });

    test('default props, product folder', async () => {
        renderWithAppContext(
            <BarTenderSettingsForm
                {...DEFAULT_PROPS}
                container={new Container({ path: '/Test/Folder', type: 'folder' })}
            />,
            {
                serverContext: {
                    moduleContext: { query: { isProductFoldersEnabled: true } },
                },
            }
        );

        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner')).toHaveLength(0);
        });

        expect(document.querySelectorAll('.label-templates-container')).toHaveLength(0);
        expect(document.querySelector('input').getAttribute('type')).toBe('url');
        validate(true);
        validateButtons(false, false);
    });

    test('default props, subfolder without folders', async () => {
        renderWithAppContext(
            <BarTenderSettingsForm
                {...DEFAULT_PROPS}
                container={new Container({ path: '/Test/Folder', type: 'folder' })}
            />,
            {
                serverContext: {
                    moduleContext: {
                        query: { isProductFoldersEnabled: false },
                    },
                },
            }
        );

        await waitFor(() => {
            expect(document.querySelectorAll('.label-templates-container')).toHaveLength(1);
        });

        validate();
        validateButtons(false, false);
    });

    test('with initial form values', async () => {
        renderWithAppContext(
            <BarTenderSettingsForm
                {...DEFAULT_PROPS}
                container={new Container({ path: '/Test' })}
                api={getTestAPIWrapper(jest.fn, {
                    labelprinting: getLabelPrintingTestAPIWrapper(jest.fn, {
                        fetchBarTenderConfiguration: jest
                            .fn()
                            .mockResolvedValue(new BarTenderConfiguration({ serviceURL: 'testServerURL' })),
                    }),
                })}
            />
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.label-templates-container')).toHaveLength(1);
        });
        validate();
        validateButtons(true, false);

        const urlInput = document.querySelector('input');
        expect(urlInput.getAttribute('value')).toBe('testServerURL');
        await userEvent.click(urlInput);
        const newUrl = 'changeURL';
        await userEvent.paste(newUrl);
        validateButtons(false, true);
    });
});
