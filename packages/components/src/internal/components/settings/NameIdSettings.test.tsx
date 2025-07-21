import React from 'react';
import { userEvent } from '@testing-library/user-event';

import { waitFor } from '@testing-library/dom';

import { BIOLOGICS_APP_PROPERTIES, SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { ComponentsAPIWrapper, getTestAPIWrapper } from '../../APIWrapper';
import { getSamplesTestAPIWrapper } from '../samples/APIWrapper';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { NameIdSettingsForm, NameIdSettingsFormProps } from './NameIdSettings';
import { TEST_FOLDER_CONTAINER } from '../../containerFixtures';
import { AppContextTestProviderProps } from '../../test/testHelpers';
import { ModuleContext } from '../base/ServerContext';

describe('NameIdSettings', () => {
    function defaultContext(api?: ComponentsAPIWrapper, moduleContext?: ModuleContext): AppContextTestProviderProps {
        return {
            appContext: {
                api:
                    api ??
                    getTestAPIWrapper(jest.fn, {
                        samples: getSamplesTestAPIWrapper(jest.fn, {
                            getSampleCounter: jest.fn().mockResolvedValue(0),
                        }),
                    }),
            },
            serverContext: {
                moduleContext: moduleContext ?? {
                    biologics: {
                        productId: BIOLOGICS_APP_PROPERTIES.productId,
                    },
                },
            },
        };
    }

    function defaultProps(): NameIdSettingsFormProps {
        return {
            container: TEST_FOLDER_CONTAINER,
            getIsDirty: jest.fn(),
            isAppHome: true,
            loadNameExpressionOptions: jest.fn(async () => {
                return { prefix: 'ABC-', allowUserSpecifiedNames: false };
            }),
            saveNameExpressionOptions: jest.fn(async () => {
                return [];
            }),
            setIsDirty: jest.fn(),
        };
    }

    test('on init', async () => {
        const loadNameExpressionOptions = jest.fn();
        renderWithAppContext(
            <NameIdSettingsForm {...defaultProps()} loadNameExpressionOptions={loadNameExpressionOptions} />,
            defaultContext()
        );
        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(3);
        expect(document.querySelectorAll('.name-id-setting__prefix-field')).toHaveLength(0);
        expect(document.querySelectorAll('.checkbox')).toHaveLength(0);

        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner')).toHaveLength(0);
        });
        expect(document.querySelectorAll('.name-id-setting__setting-section')).toHaveLength(2);
        expect(document.querySelectorAll('.name-id-setting__prefix-field')).toHaveLength(1);
        expect(document.querySelectorAll('.sample-counter__setting-section')).toHaveLength(1);
        expect(document.querySelectorAll('.sample-counter__prefix-label')).toHaveLength(2);
        expect(document.querySelectorAll('.checkbox')).toHaveLength(1);
        expect(document.querySelectorAll('.form-control')).toHaveLength(3);
        expect(document.querySelectorAll('button')).toHaveLength(3);
        expect(loadNameExpressionOptions).toHaveBeenCalled();

        const counterLabel = document.querySelectorAll('div.sample-counter__prefix-label');
        expect(counterLabel).toHaveLength(2);
        expect(counterLabel[0]).toHaveTextContent('sampleCount');
        expect(counterLabel[1]).toHaveTextContent('rootSampleCount');

        const counterInputs = document.querySelectorAll('input.update-samplecount-input');
        expect(counterInputs).toHaveLength(2);
        expect(counterInputs[0].getAttribute('value')).toBe('0');
        expect(counterInputs[1].getAttribute('value')).toBe('0');
    });

    test('not app home', async () => {
        const loadNameExpressionOptions = jest.fn();
        renderWithAppContext(
            <NameIdSettingsForm
                {...defaultProps()}
                isAppHome={false}
                loadNameExpressionOptions={loadNameExpressionOptions}
            />,
            defaultContext()
        );
        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(2);
        expect(document.querySelectorAll('.name-id-setting__prefix-field')).toHaveLength(0);
        expect(document.querySelectorAll('.checkbox')).toHaveLength(0);

        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner')).toHaveLength(0);
        });
        expect(document.querySelectorAll('.name-id-setting__setting-section')).toHaveLength(2);
        expect(document.querySelectorAll('.name-id-setting__prefix-field')).toHaveLength(1);
        expect(document.querySelectorAll('.sample-counter__setting-section')).toHaveLength(0);
        expect(document.querySelectorAll('.sample-counter__prefix-label')).toHaveLength(0);
        expect(document.querySelectorAll('.checkbox')).toHaveLength(1);
        expect(document.querySelectorAll('.form-control')).toHaveLength(1);
        expect(document.querySelectorAll('button')).toHaveLength(1);
        expect(loadNameExpressionOptions).toHaveBeenCalled();

        const counterLabel = document.querySelectorAll('div.sample-counter__prefix-label');
        expect(counterLabel).toHaveLength(0);

        const counterInputs = document.querySelectorAll('input.update-samplecount-input');
        expect(counterInputs).toHaveLength(0);
    });

    test('allowUserSpecifiedNames checkbox', async () => {
        const saveNameExpressionOptions = jest.fn();
        renderWithAppContext(
            <NameIdSettingsForm {...defaultProps()} saveNameExpressionOptions={saveNameExpressionOptions} />,
            defaultContext()
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner')).toHaveLength(0);
        });

        await userEvent.click(document.querySelectorAll('input')[0]); // check
        expect(saveNameExpressionOptions).toHaveBeenCalled();
    });

    test('prefix preview', async () => {
        renderWithAppContext(<NameIdSettingsForm {...defaultProps()} />, defaultContext());
        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner')).toHaveLength(0);
        });

        expect(document.querySelector('.name-id-setting__prefix-example').textContent).toContain('ABC-Blood-${GenId}');
    });

    test('apply prefix confirm modal -- cancel', async () => {
        renderWithAppContext(<NameIdSettingsForm {...defaultProps()} />, defaultContext());
        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner')).toHaveLength(0);
        });

        expect(document.querySelectorAll('.modal')).toHaveLength(0);
        await userEvent.type(document.querySelectorAll('input[type="text"]')[0], 'abc');
        await userEvent.click(document.querySelectorAll('button')[0]); // Apply Prefix
        expect(document.querySelectorAll('.modal')).toHaveLength(1);
        await userEvent.click(document.querySelectorAll('.close')[0]);
        expect(document.querySelectorAll('.modal')).toHaveLength(0);
    });

    test('apply prefix confirm modal -- save', async () => {
        const saveNameExpressionOptions = jest.fn();
        renderWithAppContext(
            <NameIdSettingsForm {...defaultProps()} saveNameExpressionOptions={saveNameExpressionOptions} />,
            defaultContext()
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner')).toHaveLength(0);
        });

        expect(document.querySelectorAll('.modal')).toHaveLength(0);
        await userEvent.type(document.querySelectorAll('input[type="text"]')[0], 'abc');
        await userEvent.click(document.querySelectorAll('button')[0]); // Apply Prefix
        expect(document.querySelectorAll('.modal')).toHaveLength(1);

        // Click on 'Yes, Save and Apply Prefix' button
        await userEvent.click(document.querySelector('.modal').querySelectorAll('button')[2]);
        expect(saveNameExpressionOptions).toHaveBeenCalled();
    });

    test('LKSM - not showing prefix', async () => {
        renderWithAppContext(
            <NameIdSettingsForm {...defaultProps()} />,
            defaultContext(undefined, {
                samplemanagement: {
                    productId: SAMPLE_MANAGER_APP_PROPERTIES.productId,
                },
            })
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner')).toHaveLength(0);
        });

        expect(document.querySelectorAll('.name-id-setting__setting-section')).toHaveLength(1);
        expect(document.querySelectorAll('.name-id-setting__prefix-field')).toHaveLength(0);
        expect(document.querySelectorAll('.checkbox')).toHaveLength(1);
        expect(document.querySelectorAll('.form-control')).toHaveLength(2);
    });

    test('With counter, with existing sample', async () => {
        renderWithAppContext(
            <NameIdSettingsForm {...defaultProps()} />,
            defaultContext(
                getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleCounter: jest.fn().mockResolvedValue(5),
                        hasExistingSamples: jest.fn().mockResolvedValue(true),
                    }),
                })
            )
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner')).toHaveLength(0);
        });

        expect(document.querySelectorAll('.sample-counter__setting-section')).toHaveLength(1);
        expect(document.querySelectorAll('.sample-counter__prefix-label')).toHaveLength(2);
        expect(document.querySelectorAll('.form-control')).toHaveLength(3);
        const buttons = document.querySelectorAll('button');
        expect(buttons).toHaveLength(3);

        expect(buttons[1]).toHaveTextContent('Apply New sampleCount');
        expect(buttons[2]).toHaveTextContent('Apply New rootSampleCount');

        const counterInputs = document.querySelectorAll('input.update-samplecount-input');
        expect(counterInputs).toHaveLength(2);
        expect(counterInputs[0].getAttribute('value')).toBe('5');
        expect(counterInputs[1].getAttribute('value')).toBe('5');
    });

    test('With counter, with no existing sample', async () => {
        renderWithAppContext(
            <NameIdSettingsForm {...defaultProps()} />,
            defaultContext(
                getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleCounter: jest.fn().mockResolvedValue(5),
                        hasExistingSamples: jest.fn().mockResolvedValue(false),
                    }),
                })
            )
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner')).toHaveLength(0);
        });

        expect(document.querySelectorAll('.sample-counter__setting-section')).toHaveLength(1);
        expect(document.querySelectorAll('.sample-counter__prefix-label')).toHaveLength(2);
        expect(document.querySelectorAll('.form-control')).toHaveLength(3);
        const buttons = document.querySelectorAll('button');
        expect(buttons).toHaveLength(5);

        expect(buttons[1]).toHaveTextContent('Apply New sampleCount');
        expect(buttons[2]).toHaveTextContent('Reset sampleCount');
        expect(buttons[3]).toHaveTextContent('Apply New rootSampleCount');
        expect(buttons[4]).toHaveTextContent('Reset rootSampleCount');

        const counterInputs = document.querySelectorAll('input.update-samplecount-input');
        expect(counterInputs).toHaveLength(2);
        expect(counterInputs[0].getAttribute('value')).toBe('5');
        expect(counterInputs[1].getAttribute('value')).toBe('5');
    });
});
