import { shallow } from 'enzyme';

import React from 'react';

import { RemovableButton } from '../permissions/RemovableButton';

import { MemberButtons } from './MemberButtons';
import { MemberType } from './models';

const DEFAULT_PROPS = {
    onClick: jest.fn(),
    onRemove: jest.fn(),
    title: 'Users or Groups',
    members: [{ id: 1, name: 'member', type: MemberType.user }],
    selectedPrincipalId: 2,
};

describe('MemberButtons', () => {
    test('Default', () => {
        const wrapper = shallow(<MemberButtons {...DEFAULT_PROPS} />);

        expect(wrapper.find(RemovableButton)).toHaveLength(1);
        expect(wrapper.find(RemovableButton).prop('bsStyle')).toBe('default');
        expect(wrapper.find('.permissions-groups-member-none')).toHaveLength(0);
    });

    test('With Selected Member', () => {
        const wrapper = shallow(<MemberButtons {...DEFAULT_PROPS} selectedPrincipalId={1} />);
        expect(wrapper.find(RemovableButton).prop('bsStyle')).toBe('primary');
        expect(wrapper.find('.permissions-groups-member-none')).toHaveLength(0);
    });

    test('With No Members', () => {
        const wrapper = shallow(<MemberButtons {...DEFAULT_PROPS} members={[]} />);

        expect(wrapper.find(RemovableButton)).toHaveLength(0);
        expect(wrapper.find('.permissions-groups-member-none')).toHaveLength(1);
    });
});
