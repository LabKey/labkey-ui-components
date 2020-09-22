import React from 'react';

import { shallow } from 'enzyme';

import { FileAttachmentEntry } from './FileAttachmentEntry';

describe('<FileAttachmentEntry>', () => {
    test('default props', () => {
        const wrapper = shallow(<FileAttachmentEntry onDelete={jest.fn()} name="Test files" />);
        expect(wrapper.find('span.fa-times-circle')).toHaveLength(1);
        expect(wrapper.text()).toBe('Test files');
        expect(wrapper).toMatchSnapshot();
    });
    test('no deletion', () => {
        const wrapper = shallow(<FileAttachmentEntry allowDelete={false} name="Test files" />);
        expect(wrapper.find('span.fa-times-circle')).toHaveLength(0);
        expect(wrapper).toMatchSnapshot();
    });
    test('with deleteTitleText', () => {
        const wrapper = shallow(
            <FileAttachmentEntry onDelete={jest.fn()} deleteTitleText="Delete me" name="Test files" />
        );
        expect(wrapper.find('span.fa-times-circle')).toHaveLength(1);
        expect(wrapper.find({ title: 'Delete me' })).toHaveLength(1);
        expect(wrapper).toMatchSnapshot();
    });
    test('with downloadUrl', () => {
        const wrapper = shallow(
            <FileAttachmentEntry allowDelete={false} downloadUrl="http://get/me/my/file" name="Test files" />
        );
        expect(wrapper.find('a[href="http://get/me/my/file"]')).toHaveLength(1);
        expect(wrapper).toMatchSnapshot();
    });
});
