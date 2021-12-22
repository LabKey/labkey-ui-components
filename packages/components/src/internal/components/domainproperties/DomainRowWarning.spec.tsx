import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { DomainRowWarning } from './DomainRowWarning';

describe('DomainRowWarning', () => {
    const DEFAULT_PROPS = {
        index: 0,
        msg: 'Test Warning',
        name: 'test-name',
        severity: 'warning',
    };

    function validate(wrapper: ReactWrapper, hasExtra = false): void {
        expect(wrapper.find(LabelHelpTip)).toHaveLength(hasExtra ? 1 : 0);
        expect(wrapper.find('span')).toHaveLength(hasExtra ? 2 : 0);
        expect(wrapper.find('b')).toHaveLength(1);
        expect(wrapper.find('b').key()).toBe('test-name_0');
        expect(wrapper.find('b').text()).toBe('Test Warning');
    }

    test('default props', () => {
        const wrapper = mount(<DomainRowWarning {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('extraInfo', () => {
        const wrapper = mount(<DomainRowWarning {...DEFAULT_PROPS} extraInfo="Test Extra" />);
        validate(wrapper, true);
        expect(wrapper.find(LabelHelpTip).prop('title')).toBe('warning');
        wrapper.unmount();
    });
});
