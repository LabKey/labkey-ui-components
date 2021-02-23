import React from 'react';
import { mount } from 'enzyme';

import { App } from '../../..';

import { SampleEmptyAlert, SampleTypeEmptyAlert } from './SampleEmptyAlert';

const EMPTY_ALERT = '.empty-alert';

describe('SampleEmptyAlert', () => {
    test('with permissions', () => {
        const wrapper = mount(<SampleEmptyAlert user={App.TEST_USER_FOLDER_ADMIN} />);

        // Expect default message
        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toContain(
            'No samples have been created. Click here to create samples.'
        );

        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(App.NEW_SAMPLES_HREF.toHref());
    });
    test('without permissions', () => {
        const expectedMessage = 'I am just a reader';
        const wrapper = mount(<SampleEmptyAlert message={expectedMessage} user={App.TEST_USER_READER} />);

        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toEqual(expectedMessage);
    });
});

describe('SampleTypeEmptyAlert', () => {
    test('with permissions', () => {
        const wrapper = mount(<SampleTypeEmptyAlert user={App.TEST_USER_APP_ADMIN} />);

        // Expect default message
        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toContain('No samples types have been created');

        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(App.NEW_SAMPLE_TYPE_HREF.toHref());
    });
    test('without permissions', () => {
        const expectedMessage = 'I am just a reader';
        const wrapper = mount(<SampleTypeEmptyAlert message={expectedMessage} user={App.TEST_USER_READER} />);

        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toEqual(expectedMessage);
    });
});
