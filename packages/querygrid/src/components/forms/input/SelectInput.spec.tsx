/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react'
import { shallow, mount } from 'enzyme'

import { SelectInputImpl } from './SelectInput'

describe('SelectInput', () => {

    const formsyProps = {
        formsy: true,
        getErrorMessage: () => {},
        getValue: () => {},
        setValue: () => {}
    };

    test('Should apply css classes', () => {
        const containerCls = 'container-class-test';
        const inputCls = 'input-class-test';

        let component = shallow(<SelectInputImpl {...formsyProps} containerClass={containerCls} inputClass={inputCls} />);
        expect(component.find('.' + containerCls).length).toBe(1);
        expect(component.find('.' + inputCls).length).toBe(1);
    });

    test('Should saveOnBlur - creatable', () => {

        const setValue = jest.fn();

        let selectProps = Object.assign({}, formsyProps, {
            allowCreate: true,
            saveOnBlur: true,
            setValue
        });

        let component = mount(<SelectInputImpl {...selectProps} />);

        component.find('input')
            .simulate('focus')
            .simulate('change', { target: { value: 'Hello' }})
            .simulate('blur');

        expect(setValue.mock.calls.length).toBe(1);
        expect(component.state().selectedOptions).toHaveProperty('value', 'Hello');
    });

    test('Should saveOnBlur - async', () => {

        const setValue = jest.fn();

        let selectProps = Object.assign({}, formsyProps, {
            loadOptions: (input, callback) => {
                callback(null, {
                    options: [
                        { value: 'one', label: 'One' },
                        { value: 'two', label: 'Two' }
                    ],
                    complete: true
                });
            },
            multiple: true,
            saveOnBlur: true,
            setValue
        });

        let component = mount(<SelectInputImpl {...selectProps} />);

        component.find('input')
            .simulate('focus')
            .simulate('change', { target: { value: 'Two' }})
            .simulate('blur');

        expect(setValue.mock.calls.length).toBe(1);
        expect(component.state().selectedOptions).toHaveLength(1);
    });
});