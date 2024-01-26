import React from 'react';
import { mount } from 'enzyme';

import { ConfirmModal } from '../base/ConfirmModal';

import { ConfirmDataTypeChangeModal, getDataTypeConfirmDisplayText } from './ConfirmDataTypeChangeModal';
import { DATE_TYPE, DATETIME_TYPE, PROP_DESC_TYPES, TIME_TYPE } from './PropDescType';
import {
    BOOLEAN_RANGE_URI,
    DATETIME_RANGE_URI,
    FILELINK_RANGE_URI,
    INT_RANGE_URI,
    MULTILINE_RANGE_URI, TIME_RANGE_URI,
} from './constants';

describe('ConfirmDataTypeChangeModal', () => {
    const DEFAULT_PROPS = {
        originalRangeURI: 'http://www.w3.org/2001/XMLSchema#boolean',
        newDataType: PROP_DESC_TYPES.get(0),
        onConfirm: jest.fn,
        onCancel: jest.fn,
    };

    test('default props', () => {
        const wrapper = mount(<ConfirmDataTypeChangeModal {...DEFAULT_PROPS} />);
        expect(wrapper.find(ConfirmModal)).toHaveLength(1);
        const displayText = wrapper.find(ConfirmModal).find('div').first().text();
        expect(displayText).toContain('This change will convert the values in the field from boolean to string.');
        expect(displayText).toContain('you will not be able to change it back to boolean.');
        wrapper.unmount();
    });

    test('getDataTypeConfirmDisplayText', () => {
        expect(getDataTypeConfirmDisplayText(INT_RANGE_URI)).toBe('integer');
        expect(getDataTypeConfirmDisplayText(MULTILINE_RANGE_URI)).toBe('string');
        expect(getDataTypeConfirmDisplayText(FILELINK_RANGE_URI)).toBe('file');
        expect(getDataTypeConfirmDisplayText(BOOLEAN_RANGE_URI)).toBe('boolean');
        expect(getDataTypeConfirmDisplayText(DATETIME_RANGE_URI)).toBe('dateTime');
    });

    test('from datetime to time', () => {
        const wrapper = mount(<ConfirmDataTypeChangeModal
            {...DEFAULT_PROPS}
            originalRangeURI={DATETIME_RANGE_URI}
            newDataType={TIME_TYPE}
        />);
        expect(wrapper.find(ConfirmModal)).toHaveLength(1);
        const displayText = wrapper.find(ConfirmModal).find('div').first().text();
        expect(displayText).toContain('This change will convert the values in the field from dateTime to time. This will cause the Date portion of the value to be removed. Once you save your changes, you will not be able to change it back to dateTime.');
        wrapper.unmount();
    });

    test('from datetime to date', () => {
        const wrapper = mount(<ConfirmDataTypeChangeModal
            {...DEFAULT_PROPS}
            originalRangeURI={DATETIME_RANGE_URI}
            newDataType={DATE_TYPE}
        />);
        expect(wrapper.find(ConfirmModal)).toHaveLength(1);
        const displayText = wrapper.find(ConfirmModal).find('div').first().text();
        expect(displayText).toContain('This change will convert the values in the field from dateTime to date. This will cause the Time portion of the value to be removed.');
        wrapper.unmount();
    });

    test('from date to datetime', () => {
        const wrapper = mount(<ConfirmDataTypeChangeModal
            {...DEFAULT_PROPS}
            originalRangeURI={TIME_RANGE_URI}
            newDataType={DATETIME_TYPE}
        />);
        expect(wrapper.find(ConfirmModal)).toHaveLength(1);
        const displayText = wrapper.find(ConfirmModal).find('div').first().text();
        expect(displayText).toContain('This change will convert the values in the field from time to dateTime. Once you save your changes, you will not be able to change it back to time.');
        wrapper.unmount();
    });

});
