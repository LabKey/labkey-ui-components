import React from 'react';
import { getTestAPIWrapper } from '../../APIWrapper';

import { Container } from '../base/models/Container';

import { getLabelPrintingTestAPIWrapper } from './APIWrapper';

import { BarTenderSettingsForm } from './BarTenderSettingsForm';
import { BarTenderConfiguration } from './models';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { waitFor } from '@testing-library/dom';

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
        expect(document.querySelectorAll('button')).toHaveLength(1);
    }

    function validateInputsAndButtons(canTest?: boolean, canSave?: boolean): void {
        expect(document.querySelector('input').getAttribute('type')).toBe('url');
        const buttons = document.querySelectorAll('button');
        expect(buttons).toHaveLength(1);
        if (canTest) {
            expect(buttons.item(0).textContent).toBe('Test Connection');
            expect(buttons.item(0).getAttribute('disabled')).toBeFalsy();
        } else {
            expect(buttons.item(0).textContent).toBe('Save');
            if (canSave) {
                expect(buttons.item(0).getAttribute('disabled')).toBeTruthy();
            } else {
                expect(buttons.item(0).getAttribute('disabled')).toBeFalsy();
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
        validateInputsAndButtons();
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
            expect(document.querySelectorAll('.fa-spainner')).toHaveLength(0);
        });

        expect(document.querySelectorAll('.label-templates-container')).toHaveLength(0);
        validate(true);
        validateInputsAndButtons();
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
        validateInputsAndButtons();

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
        validateInputsAndButtons(true, false);
        expect(document.querySelector('input').getAttribute('value')).toBe('testServerURL');

    });
});
