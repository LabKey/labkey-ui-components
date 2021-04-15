import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Modal } from 'react-bootstrap';

import { LoadingSpinner, LoadingState } from '../..';

import { AttachmentCard } from './AttachmentCard';

const DEFAULT_PROPS = {
    attachment: { name: 'name.txt', iconFontCls: 'fa-test' },
};

describe('AttachmentCard', () => {
    function validate(wrapper: ReactWrapper, rendered = true, iconFontCls = 'fa-test', loadingCount = 0): void {
        const renderedCount = rendered ? 1 : 0;
        const isImage = iconFontCls === null;
        const isLoading = loadingCount > 0;

        expect(wrapper.find('.attachment-card')).toHaveLength(renderedCount);
        expect(wrapper.find('.attachment-card__body')).toHaveLength(renderedCount);
        expect(wrapper.find('.attachment-card__icon')).toHaveLength(renderedCount);
        expect(wrapper.find('.attachment-card__icon_img')).toHaveLength(isImage && !isLoading ? renderedCount : 0);
        expect(wrapper.find('.attachment-card__icon_tile')).toHaveLength(!isImage ? renderedCount : 0);
        expect(wrapper.find('.attachment-card__content')).toHaveLength(renderedCount);
        expect(wrapper.find('.attachment-card__size')).toHaveLength(renderedCount);
        expect(wrapper.find('.attachment-card__menu').hostNodes()).toHaveLength(isLoading ? 0 : renderedCount);

        expect(wrapper.find(LoadingSpinner)).toHaveLength(loadingCount);
        if (rendered) {
            const cardOnClick = wrapper.find('.attachment-card__body').prop('onClick');
            if (isLoading) {
                expect(cardOnClick).toBeUndefined();
            } else {
                expect(cardOnClick).toBeDefined();
            }
        }

        expect(wrapper.find(Modal)).toHaveLength(renderedCount);
        if (rendered) expect(wrapper.find(Modal).prop('show')).toBe(false);
    }

    test('default props', () => {
        const wrapper = mount(<AttachmentCard {...DEFAULT_PROPS} />);
        validate(wrapper);
        expect(wrapper.find('.attachment-card').prop('title')).toBe(DEFAULT_PROPS.attachment.name);
        expect(wrapper.find('.attachment-card__name').text()).toBe(DEFAULT_PROPS.attachment.name);
        wrapper.unmount();
    });

    test('without attachment', () => {
        const wrapper = mount(<AttachmentCard {...DEFAULT_PROPS} attachment={undefined} />);
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('loadingState non-image', () => {
        const wrapper = mount(
            <AttachmentCard
                {...DEFAULT_PROPS}
                attachment={{ ...DEFAULT_PROPS.attachment, loadingState: LoadingState.LOADING }}
            />
        );
        validate(wrapper, true, DEFAULT_PROPS.attachment.iconFontCls, 1);
        wrapper.unmount();
    });

    test('loadingState image', () => {
        const wrapper = mount(
            <AttachmentCard
                {...DEFAULT_PROPS}
                attachment={{ ...DEFAULT_PROPS.attachment, name: 'test.png', loadingState: LoadingState.LOADING }}
            />
        );
        validate(wrapper, true, null, 2);
        wrapper.unmount();
    });

    test('image attachment', () => {
        const wrapper = mount(
            <AttachmentCard
                {...DEFAULT_PROPS}
                attachment={{ ...DEFAULT_PROPS.attachment, name: 'test.png' }}
                imageURL="testurl"
                imageCls="testcls"
            />
        );
        validate(wrapper, true, null);
        expect(wrapper.find('.testcls')).toHaveLength(1);
        expect(wrapper.find('.attachment-card__icon_img').prop('src')).toBe('testurl');
        expect(wrapper.find('.attachment-card__icon_img').prop('alt')).toBe('test.png');
        wrapper.unmount();
    });

    test('recently created', () => {
        const wrapper = mount(
            <AttachmentCard
                {...DEFAULT_PROPS}
                attachment={{ ...DEFAULT_PROPS.attachment, created: new Date().valueOf(), size: 1024 }}
            />
        );
        validate(wrapper);
        expect(wrapper.find('.attachment-card__size').text()).toBe(' File attached');
        wrapper.unmount();
    });

    test('formatBytes', () => {
        const wrapper = mount(
            <AttachmentCard
                {...DEFAULT_PROPS}
                attachment={{ ...DEFAULT_PROPS.attachment, created: new Date('2020-01-01').valueOf(), size: 1024 }}
            />
        );
        validate(wrapper);
        expect(wrapper.find('.attachment-card__size').text()).toBe('1 KB');
        wrapper.unmount();
    });
});
