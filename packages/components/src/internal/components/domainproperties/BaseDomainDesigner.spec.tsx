import React from 'react';
import { List } from 'immutable';
import { mount } from 'enzyme';

import { Alert } from '../base/Alert';

import { BaseDomainDesigner } from './BaseDomainDesigner';
import { DomainDesign } from './models';
import { SEVERITY_LEVEL_ERROR } from './constants';

const BASE_PROPS = {
    hasValidProperties: true,
    exception: undefined,
    domains: List.of(DomainDesign.create({})),
    name: 'Test',
    submitting: false,
    visitedPanels: List.of(0),
    onCancel: jest.fn(),
    onFinish: jest.fn(),
};

describe('BaseDomainDesigner', () => {
    function buttonValidation(component, saveBtnText: string, saveDisabled: boolean): void {
        expect(component.find('.cancel-button')).toHaveLength(1);
        expect(component.find('.save-button').text()).toBe(saveBtnText);
        expect(component.find('.save-button').props().disabled).toBe(saveDisabled);
    }

    test('without error', () => {
        const component = mount(<BaseDomainDesigner {...BASE_PROPS} />);
        expect(component.find(Alert)).toHaveLength(0);
        expect(component.find('.form-buttons')).toHaveLength(1);
        buttonValidation(component, 'Save', false);
        component.unmount();
    });

    test('hasValidProperties', () => {
        const component = mount(<BaseDomainDesigner {...BASE_PROPS} hasValidProperties={false} />);
        expect(component.find(Alert)).toHaveLength(1);
        expect(component.find(Alert).text()).toBe('Please correct errors in the properties panel before saving.');
        expect(component.find('.form-buttons')).toHaveLength(1);
        buttonValidation(component, 'Save', false);
        component.unmount();
    });

    test('exception', () => {
        const component = mount(<BaseDomainDesigner {...BASE_PROPS} exception="Test exception text" />);
        expect(component.find(Alert)).toHaveLength(1);
        expect(component.find(Alert).text()).toBe('Test exception text');
        expect(component.find('.form-buttons')).toHaveLength(1);
        buttonValidation(component, 'Save', false);
        component.unmount();
    });

    test('errorDomains', () => {
        const component = mount(
            <BaseDomainDesigner
                {...BASE_PROPS}
                domains={List.of(
                    DomainDesign.create(
                        { name: BASE_PROPS.name },
                        { exception: 'test1', severity: SEVERITY_LEVEL_ERROR }
                    )
                )}
            />
        );
        expect(component.find(Alert)).toHaveLength(1);
        expect(component.find(Alert).text()).toBe('Please correct errors in Test before saving.');
        expect(component.find('.form-buttons')).toHaveLength(1);
        buttonValidation(component, 'Save', false);
        component.unmount();
    });

    test('submitting, saveBtnText', () => {
        const component = mount(<BaseDomainDesigner {...BASE_PROPS} submitting={true} saveBtnText="Finish" />);
        expect(component.find(Alert)).toHaveLength(0);
        expect(component.find('.form-buttons')).toHaveLength(1);
        buttonValidation(component, 'Finish', true);
        component.unmount();
    });
});
