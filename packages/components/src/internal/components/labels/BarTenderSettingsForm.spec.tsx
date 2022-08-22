import React from 'react';
import { FormControl, Button } from 'react-bootstrap';
import { mount, ReactWrapper } from 'enzyme';

import { mountWithAppServerContext, waitForLifecycle } from '../../testHelpers';
import { getTestAPIWrapper } from '../../APIWrapper';

import { getLabelPrintingTestAPIWrapper } from './APIWrapper';

import { BarTenderSettingsFormImpl } from './BarTenderSettingsForm';
import { BarTenderConfiguration } from './models';

describe('BarTenderSettingsForm', () => {
    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn, {
            labelprinting: getLabelPrintingTestAPIWrapper(jest.fn, {}),
        }),
        canPrintLabels: false,
        labelTemplate: '',
        printServiceUrl: '',
        onChange: jest.fn(),
        onSuccess: jest.fn(),
    };

    function validate(wrapper: ReactWrapper, withHeading = true): void {
        expect(wrapper.find('.panel-heading')).toHaveLength(withHeading ? 1 : 0);
        expect(wrapper.find('.permissions-save-alert')).toHaveLength(0);
        expect(wrapper.find(FormControl)).toHaveLength(2);
        expect(wrapper.find('.label-printing--help-link').hostNodes()).toHaveLength(1);
        expect(wrapper.find(Button)).toHaveLength(2);
    }

    test('default props', () => {
        const wrapper = mountWithAppServerContext(<BarTenderSettingsFormImpl {...DEFAULT_PROPS} />);
        validate(wrapper);
        expect(wrapper.find(FormControl).first().prop('type')).toBe('url');
        expect(wrapper.find(FormControl).last().prop('type')).toBe('text');
        expect(wrapper.find(Button).first().text()).toBe('Save');
        expect(wrapper.find(Button).first().prop('disabled')).toBeTruthy();
        expect(wrapper.find(Button).last().text()).toBe('Test Connection');
        expect(wrapper.find(Button).last().prop('disabled')).toBeTruthy();
        wrapper.unmount();
    });

    test('titleCls', () => {
        const wrapper = mount(<BarTenderSettingsFormImpl {...DEFAULT_PROPS} titleCls="test-title-cls" />);
        validate(wrapper, false);
        expect(wrapper.find('.test-title-cls')).toHaveLength(1);
        wrapper.unmount();
    });

    test('with initial form values', async () => {
        const wrapper = mountWithAppServerContext(
            <BarTenderSettingsFormImpl
                {...DEFAULT_PROPS}
                api={getTestAPIWrapper(jest.fn, {
                    labelprinting: getLabelPrintingTestAPIWrapper(jest.fn, {
                        fetchBarTenderConfiguration: () => Promise.resolve(new BarTenderConfiguration({
                            defaultLabel: 'testDefaultLabel',
                            serviceURL: 'testServerURL'
                        })),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(FormControl).first().prop('type')).toBe('url');
        expect(wrapper.find(FormControl).first().prop('value')).toBe('testServerURL');
        expect(wrapper.find(FormControl).last().prop('type')).toBe('text');
        expect(wrapper.find(FormControl).last().prop('value')).toBe('testDefaultLabel');
        expect(wrapper.find(Button).first().text()).toBe('Save');
        expect(wrapper.find(Button).first().prop('disabled')).toBeTruthy();
        expect(wrapper.find(Button).last().text()).toBe('Test Connection');
        expect(wrapper.find(Button).last().prop('disabled')).toBeFalsy();
        wrapper.unmount();
    });
});
