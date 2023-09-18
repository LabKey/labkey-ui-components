import React from 'react';
import { FormControl, Button } from 'react-bootstrap';
import { mount, ReactWrapper } from 'enzyme';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { getTestAPIWrapper } from '../../APIWrapper';

import { Container } from '../base/models/Container';

import { getLabelPrintingTestAPIWrapper } from './APIWrapper';

import { BarTenderSettingsFormImpl } from './BarTenderSettingsForm';
import { BarTenderConfiguration } from './models';
import { LabelsConfigurationPanel } from './LabelsConfigurationPanel';

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

    function validate(wrapper: ReactWrapper, withHeading = true, withLabelConfigPanel = true): void {
        expect(wrapper.find(LabelsConfigurationPanel)).toHaveLength(withLabelConfigPanel ? 1 : 0);
        expect(wrapper.find('.panel-heading')).toHaveLength(withHeading ? 1 : 0);
        expect(wrapper.find('.permissions-save-alert')).toHaveLength(0);
        expect(wrapper.find('.label-printing--help-link').hostNodes()).toHaveLength(1);
        expect(wrapper.find(Button)).toHaveLength(2);
    }

    function validateUrlInput(wrapper: ReactWrapper): void {
        expect(wrapper.find(FormControl).first().prop('type')).toBe('url');
        expect(wrapper.find(Button).first().text()).toBe('Save');
        expect(wrapper.find(Button).first().prop('disabled')).toBeTruthy();
        expect(wrapper.find(Button).last().text()).toBe('Test Connection');
        expect(wrapper.find(Button).last().prop('disabled')).toBeTruthy();
    }

    test('default props, home project', async () => {
        const wrapper = mountWithAppServerContext(<BarTenderSettingsFormImpl {...DEFAULT_PROPS} />, undefined, {
            container: new Container({ path: '/Test' }),
        });
        await waitForLifecycle(wrapper);
        validate(wrapper);
        validateUrlInput(wrapper);
        wrapper.unmount();
    });

    test('default props, product project', async () => {
        const wrapper = mountWithAppServerContext(<BarTenderSettingsFormImpl {...DEFAULT_PROPS} />, undefined, {
            container: new Container({ path: '/Test/Folder', type: 'folder' }),
            moduleContext: { query: { isProductProjectsEnabled: true } },
        });

        await waitForLifecycle(wrapper);

        validate(wrapper, true, false);
        validateUrlInput(wrapper);

        wrapper.unmount();
    });

    test('default props, subfolder without projects', async () => {
        const wrapper = mountWithAppServerContext(<BarTenderSettingsFormImpl {...DEFAULT_PROPS} />, undefined, {
            container: new Container({ path: '/Test/Folder', type: 'folder' }),
            moduleContext: { query: { isProductProjectsEnabled: false } },
        });

        await waitForLifecycle(wrapper);

        validate(wrapper, true, true);
        validateUrlInput(wrapper);

        wrapper.unmount();
    });


    test('with initial form values', async () => {
        const wrapper = mountWithAppServerContext(
            <BarTenderSettingsFormImpl
                {...DEFAULT_PROPS}
                api={getTestAPIWrapper(jest.fn, {
                    labelprinting: getLabelPrintingTestAPIWrapper(jest.fn, {
                        fetchBarTenderConfiguration: () =>
                            Promise.resolve(
                                new BarTenderConfiguration({
                                    serviceURL: 'testServerURL',
                                })
                            ),
                    }),
                })}
            />,
            undefined,
            {
                container: new Container({ path: '/Test' }),
            }
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(FormControl).first().prop('type')).toBe('url');
        expect(wrapper.find(FormControl).first().prop('value')).toBe('testServerURL');
        expect(wrapper.find(Button).first().text()).toBe('Save');
        expect(wrapper.find(Button).first().prop('disabled')).toBeTruthy();
        expect(wrapper.find(Button).last().text()).toBe('Test Connection');
        expect(wrapper.find(Button).last().prop('disabled')).toBeFalsy();
        wrapper.unmount();
    });
});
