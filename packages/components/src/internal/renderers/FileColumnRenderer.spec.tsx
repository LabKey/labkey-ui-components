import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { fromJS } from 'immutable';

import { QueryColumn } from '../..';

import { FILELINK_RANGE_URI } from '../components/domainproperties/constants';

import { FileColumnRenderer, getAttachmentTitleFromName } from './FileColumnRenderer';
import { AttachmentCard } from './AttachmentCard';

const DEFAULT_PROPS = {
    data: fromJS({ url: 'testurl', value: 'test.txt', displayValue: 'Test.txt' }),
};

describe('FileColumnRenderer', () => {
    function validate(
        wrapper: ReactWrapper,
        hasCard = true,
        noun = 'attachment',
        allowRemove = false,
        imageURL?: string
    ): void {
        expect(wrapper.find(AttachmentCard)).toHaveLength(hasCard ? 1 : 0);
        if (hasCard) {
            expect(wrapper.find(AttachmentCard).prop('noun')).toBe(noun);
            expect(wrapper.find(AttachmentCard).prop('imageURL')).toBe(imageURL);
            expect(wrapper.find(AttachmentCard).prop('allowRemove')).toBe(allowRemove);
        }
    }

    test('no data', () => {
        const wrapper = mount(<FileColumnRenderer />);
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('no name', () => {
        const wrapper = mount(<FileColumnRenderer data={fromJS({ url: 'test' })} />);
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('file rangeURI', () => {
        const wrapper = mount(
            <FileColumnRenderer {...DEFAULT_PROPS} col={new QueryColumn({ rangeURI: FILELINK_RANGE_URI })} />
        );
        validate(wrapper, true, 'file');
        wrapper.unmount();
    });

    test('isImage', () => {
        const wrapper = mount(
            <FileColumnRenderer data={fromJS({ url: 'testurl', value: 'test.png', displayValue: 'Test.png' })} />
        );
        validate(wrapper, true, 'attachment', false, 'testurl');
        wrapper.unmount();
    });

    test('allowRemove', () => {
        const wrapper = mount(<FileColumnRenderer {...DEFAULT_PROPS} onRemove={jest.fn} />);
        validate(wrapper, true, 'attachment', true);
        wrapper.unmount();
    });
});

describe('getAttachmentTitleFromName', () => {
    test('without dir prefix', () => {
        expect(getAttachmentTitleFromName('test.tsv')).toBe('test.tsv');
    });

    test('with dir prefix', () => {
        expect(getAttachmentTitleFromName('something/test.tsv')).toBe('test.tsv');
        expect(getAttachmentTitleFromName('sampletype/test.tsv')).toBe('test.tsv');
        expect(getAttachmentTitleFromName('sampleset/test.tsv')).toBe('test.tsv');
    });
});
