import { shallow } from 'enzyme';
import React from 'react';

import { DisableableButton } from './DisableableButton';

describe('DisableableButton', () => {
    test('No disabled message', () => {
        const wrapper = shallow(<DisableableButton bsStyle="primary" onClick={jest.fn()} />);

        expect(wrapper.find('button').prop('disabled')).toEqual(false);
    });

    test('With disabled message', () => {
        const wrapper = shallow(
            <DisableableButton
                bsStyle="primary"
                onClick={jest.fn()}
                disabledMsg="An informative message"
                title="the title"
            />
        );

        expect(wrapper.find('button').prop('disabled')).toEqual(true);
    });

    test('With styles', () => {
        const wrapper = shallow(<DisableableButton bsStyle="primary" onClick={jest.fn()} className="classname1" />);

        expect(wrapper.find('button').prop('className')).toBe('classname1 btn btn-primary');
    });
});
