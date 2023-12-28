import React from 'react';
import { mount } from 'enzyme';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { DomainRowWarning } from './DomainRowWarning';
import { DomainFieldError } from './models';

describe('DomainRowWarning', () => {
    test('without extra info', () => {
        const wrapper = mount(
            <DomainRowWarning fieldError={new DomainFieldError({ message: 'Test Warning', severity: 'Warning' })} />
        );
        expect(wrapper.text()).toBe('Warning: Test Warning');
        wrapper.unmount();
    });

    test('with extra info', () => {
        const wrapper = mount(
            <DomainRowWarning
                fieldError={
                    new DomainFieldError({ message: 'Test Warning', severity: 'Warning', extraInfo: 'Test Extra' })
                }
            />
        );
        expect(wrapper.find(LabelHelpTip)).toHaveLength(1);
        wrapper.unmount();
    });
});
