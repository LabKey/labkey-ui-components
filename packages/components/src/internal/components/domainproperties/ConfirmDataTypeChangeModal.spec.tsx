import React from 'react';
import { mount } from 'enzyme';

import {ConfirmDataTypeChangeModal, getDataTypeConfirmDisplayText} from './ConfirmDataTypeChangeModal';
import {ConfirmModal} from "../base/ConfirmModal";
import {PROP_DESC_TYPES} from "./PropDescType";
import {
    BOOLEAN_RANGE_URI,
    DATETIME_RANGE_URI,
    FILELINK_RANGE_URI,
    INT_RANGE_URI,
    MULTILINE_RANGE_URI
} from "./constants";

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
        expect(getDataTypeConfirmDisplayText(INT_RANGE_URI)).toBe('Integer');
        expect(getDataTypeConfirmDisplayText(MULTILINE_RANGE_URI)).toBe('String');
        expect(getDataTypeConfirmDisplayText(FILELINK_RANGE_URI)).toBe('File');
        expect(getDataTypeConfirmDisplayText(BOOLEAN_RANGE_URI)).toBe('boolean');
        expect(getDataTypeConfirmDisplayText(DATETIME_RANGE_URI)).toBe('dateTime');
    });
});
