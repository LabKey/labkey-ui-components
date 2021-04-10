import React from 'react';
import { mount } from 'enzyme';

import { App } from '../../..';

import { AssayDesignEmptyAlert } from './AssayDesignEmptyAlert';

const EMPTY_ALERT = '.empty-alert';

describe('AssayDesignEmptyAlert', () => {
    test('with permissions', () => {
        const wrapper = mount(<AssayDesignEmptyAlert user={App.TEST_USER_ASSAY_DESIGNER} />);

        // Expect default message
        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toContain('No assays have been created.');

        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(App.NEW_ASSAY_DESIGN_HREF.toHref());
    });
    test('without permissions', () => {
        const expectedMessage = 'I am just a reader';
        const wrapper = mount(<AssayDesignEmptyAlert message={expectedMessage} user={App.TEST_USER_READER} />);

        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toEqual(expectedMessage);
    });
});
