import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LoadingState } from '../../public/LoadingState';

import { AttachmentCard } from './AttachmentCard';

const DEFAULT_PROPS = {
    attachment: { name: 'name.txt', iconFontCls: 'fa-test' },
};

const UNAVAILABLE_ATTACHMENT = {
    attachment: { name: 'name.txt', iconFontCls: 'fa-test', unavailable: true },
};

describe('AttachmentCard', () => {
    function validate(
        rendered = true,
        iconFontCls = 'fa-test',
        loadingCount = 0,
        descriptionCount = 0,
        available = true
    ): void {
        const renderedCount = rendered ? 1 : 0;
        const isImage = iconFontCls === null;
        const isLoading = loadingCount > 0;

        expect(document.querySelectorAll('.attachment-card').length).toBe(renderedCount);
        expect(document.querySelectorAll('.attachment-card__body').length).toBe(renderedCount);
        expect(document.querySelectorAll('.attachment-card__icon').length).toBe(renderedCount);
        expect(document.querySelectorAll('.attachment-card__icon_img').length).toBe(
            isImage && !isLoading ? renderedCount : 0
        );
        expect(document.querySelectorAll('.attachment-card__icon_tile').length).toBe(!isImage ? renderedCount : 0);
        expect(document.querySelectorAll('.attachment-card__content').length).toBe(renderedCount);
        expect(document.querySelectorAll('.attachment-card__description').length).toBe(descriptionCount);
        expect(document.querySelectorAll('.attachment-card__size').length).toBe(renderedCount);
        expect(document.querySelectorAll('.attachment-unavailable').length).toBe(available ? 0 : 1);
        expect(document.querySelectorAll('.attachment-card__menu').length).toBe(
            isLoading || !available ? 0 : renderedCount
        );
        expect(document.querySelectorAll('.fa-spinner').length).toBe(loadingCount);

        if (!isImage) {
            expect(document.querySelectorAll('.' + iconFontCls).length).toBe(1);
        }
    }

    test('default props', () => {
        render(<AttachmentCard {...DEFAULT_PROPS} />);
        validate();
        expect(document.querySelector('.attachment-card').getAttribute('title')).toBe(DEFAULT_PROPS.attachment.name);
        expect(document.querySelector('.attachment-card__name').innerHTML).toBe(DEFAULT_PROPS.attachment.name);
    });

    test('onDownload with allowDownload true', () => {
        const onDownload = jest.fn();
        render(<AttachmentCard {...DEFAULT_PROPS} onDownload={onDownload} allowDownload />);
        userEvent.click(document.querySelector('.attachment-card__body'));
        expect(onDownload).toHaveBeenCalledTimes(1);
    });

    test('onDownload with allowDownload true, but attachment unavailable', () => {
        const onDownload = jest.fn();
        render(<AttachmentCard {...UNAVAILABLE_ATTACHMENT} onDownload={onDownload} allowDownload />);
        validate(true, 'fa-test', 0, 0, false);
        userEvent.click(document.querySelector('.attachment-card__body'));
        expect(onDownload).toHaveBeenCalledTimes(0);
    });

    test('onDownload with allowDownload false', () => {
        const onDownload = jest.fn();
        render(<AttachmentCard {...DEFAULT_PROPS} onDownload={onDownload} allowDownload={false} />);
        userEvent.click(document.querySelector('.attachment-card__body'));
        expect(onDownload).toHaveBeenCalledTimes(0);
    });

    test('with title', () => {
        const attachment = { name: 'dir/name.txt', title: 'name.txt', iconFontCls: 'fa-test' };
        render(<AttachmentCard attachment={attachment} />);
        validate();
        expect(document.querySelector('.attachment-card').getAttribute('title')).toBe(attachment.name);
        expect(document.querySelector('.attachment-card__name').innerHTML).toBe(attachment.title);
    });

    test('iconFontCls from name', () => {
        const attachment = { name: 'dir/name.txt', title: 'name.txt' };
        render(<AttachmentCard attachment={attachment} />);
        validate(true, 'fa-file-text-o');
    });

    test('with description', () => {
        const attachment = { name: 'dir/name.txt', title: 'name.txt', description: 'testing description for card' };
        render(<AttachmentCard attachment={attachment} />);
        validate(true, 'fa-file-text-o', 0, 1);
    });

    test('without attachment', () => {
        render(<AttachmentCard {...DEFAULT_PROPS} attachment={undefined} />);
        validate(false, null);
    });

    test('loadingState non-image', () => {
        render(
            <AttachmentCard
                {...DEFAULT_PROPS}
                attachment={{ ...DEFAULT_PROPS.attachment, loadingState: LoadingState.LOADING }}
            />
        );
        validate(true, DEFAULT_PROPS.attachment.iconFontCls, 1);
    });

    test('loadingState image', () => {
        render(
            <AttachmentCard
                {...DEFAULT_PROPS}
                attachment={{ ...DEFAULT_PROPS.attachment, name: 'test.png', loadingState: LoadingState.LOADING }}
            />
        );
        validate(true, null, 2);
    });

    test('image attachment', () => {
        render(
            <AttachmentCard
                {...DEFAULT_PROPS}
                attachment={{ ...DEFAULT_PROPS.attachment, name: 'test.png' }}
                imageURL="testurl"
                imageCls="testcls"
            />
        );
        validate(true, null);
        expect(document.querySelectorAll('.testcls').length).toBe(1);
        expect(document.querySelector('.attachment-card__icon_img').getAttribute('src')).toBe('testurl');
        expect(document.querySelector('.attachment-card__icon_img').getAttribute('alt')).toBe('test.png');
    });

    test('image attachment, unavailable', () => {
        render(
            <AttachmentCard
                {...DEFAULT_PROPS}
                attachment={{ ...DEFAULT_PROPS.attachment, name: 'test.png', unavailable: true }}
                imageURL="testurl"
                imageCls="testcls"
            />
        );
        validate(true, 'fa-test', 0, 0, false);
        expect(document.querySelectorAll('.testcls').length).toBe(0);
        expect(document.querySelectorAll('.attachment-card__icon_img').length).toBe(0);
        expect(document.querySelectorAll('.attachment-card__icon_img').length).toBe(0);
    });

    test('recently created', () => {
        render(
            <AttachmentCard
                {...DEFAULT_PROPS}
                attachment={{ ...DEFAULT_PROPS.attachment, created: new Date().valueOf(), size: 1024 }}
            />
        );
        validate();
        expect(document.querySelector('.attachment-card__size').innerHTML).toContain(' File attached');
    });

    test('formatBytes', () => {
        render(
            <AttachmentCard
                {...DEFAULT_PROPS}
                attachment={{ ...DEFAULT_PROPS.attachment, created: new Date('2020-01-01').valueOf(), size: 1024 }}
            />
        );
        validate();
        expect(document.querySelector('.attachment-card__size').innerHTML).toBe('1 KB');
    });

    test('outerCls', () => {
        render(<AttachmentCard {...DEFAULT_PROPS} outerCls="outer-class-test" />);
        validate();
        expect(document.querySelectorAll('.outer-class-test').length).toBe(1);
    });
});
