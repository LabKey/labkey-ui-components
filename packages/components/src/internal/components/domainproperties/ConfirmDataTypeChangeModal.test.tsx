import React from 'react';
import { render } from '@testing-library/react';

import { ConfirmDataTypeChangeModal, getDataTypeConfirmDisplayText } from './ConfirmDataTypeChangeModal';
import {
    BOOLEAN_TYPE,
    DATE_TYPE,
    DATETIME_TYPE,
    FILE_TYPE,
    INTEGER_TYPE,
    MULTI_CHOICE_TYPE,
    MULTILINE_TYPE,
    PROP_DESC_TYPES,
    TEXT_CHOICE_TYPE,
    TEXT_TYPE,
    TIME_TYPE,
} from './PropDescType';
import {
    BOOLEAN_RANGE_URI,
    DATETIME_RANGE_URI,
    FILELINK_RANGE_URI,
    MULTI_CHOICE_RANGE_URI,
    MULTILINE_RANGE_URI,
    TEXT_CHOICE_CONCEPT_URI,
    TIME_RANGE_URI,
} from './constants';

describe('ConfirmDataTypeChangeModal', () => {
    const intType = {
        rangeURI: 'http://www.w3.org/2001/XMLSchema#int',
        dataType: INTEGER_TYPE,
    };

    const multiLineType = {
        rangeURI: MULTILINE_RANGE_URI,
        dataType: MULTILINE_TYPE,
    };

    const fileLinkType = {
        rangeURI: FILELINK_RANGE_URI,
        dataType: FILE_TYPE,
    };

    const booleanType = {
        rangeURI: BOOLEAN_RANGE_URI,
        dataType: BOOLEAN_TYPE,
    };

    const dateTimeType = {
        rangeURI: DATETIME_RANGE_URI,
        dataType: DATETIME_TYPE,
    };

    const timeType = {
        rangeURI: TIME_RANGE_URI,
        dataType: TIME_TYPE,
    };

    const multiChoiceType = {
        rangeURI: MULTI_CHOICE_RANGE_URI,
        dataType: MULTI_CHOICE_TYPE,
    };

    const textChoiceType = {
        conceptURI: TEXT_CHOICE_CONCEPT_URI,
        dataType: TEXT_CHOICE_TYPE,
    };

    const DEFAULT_PROPS = {
        original: {
            rangeURI: 'http://www.w3.org/2001/XMLSchema#boolean',
            dataType: BOOLEAN_TYPE,
        },
        newDataType: PROP_DESC_TYPES.get(0),
        onConfirm: jest.fn,
        onCancel: jest.fn,
    };

    test('default props', () => {
        render(<ConfirmDataTypeChangeModal {...DEFAULT_PROPS} />);
        expect(document.body).toHaveTextContent(
            'This change will convert the values in the field from boolean to string.'
        );
        expect(document.body).toHaveTextContent('you will not be able to change it back to boolean.');
    });

    test('getDataTypeConfirmDisplayText', () => {
        expect(getDataTypeConfirmDisplayText(intType.dataType)).toBe('integer');
        expect(getDataTypeConfirmDisplayText(multiLineType.dataType)).toBe('string');
        expect(getDataTypeConfirmDisplayText(fileLinkType.dataType)).toBe('file');
        expect(getDataTypeConfirmDisplayText(booleanType.dataType)).toBe('boolean');
        expect(getDataTypeConfirmDisplayText(dateTimeType.dataType)).toBe('dateTime');
        expect(getDataTypeConfirmDisplayText(multiChoiceType.dataType)).toBe('Text Choice (multiple select)');
        expect(getDataTypeConfirmDisplayText(textChoiceType.dataType)).toBe('Text Choice (single select)');
    });

    test('from datetime to time', () => {
        render(<ConfirmDataTypeChangeModal {...DEFAULT_PROPS} newDataType={TIME_TYPE} original={dateTimeType} />);
        expect(document.body).toHaveTextContent(
            'This change will convert the values in the field from dateTime to time. This will cause the Date portion of the value to be removed. Once you save your changes, you will not be able to change it back to dateTime.'
        );
    });

    test('from datetime to date', () => {
        render(<ConfirmDataTypeChangeModal {...DEFAULT_PROPS} newDataType={DATE_TYPE} original={dateTimeType} />);
        expect(document.body).toHaveTextContent(
            'This change will convert the values in the field from dateTime to date. This will cause the Time portion of the value to be removed.'
        );
    });

    test('from date to datetime', () => {
        render(<ConfirmDataTypeChangeModal {...DEFAULT_PROPS} newDataType={DATETIME_TYPE} original={timeType} />);
        expect(document.body).toHaveTextContent(
            'This change will convert the values in the field from time to dateTime. Once you save your changes, you will not be able to change it back to time.'
        );
    });

    test('from text choice to mvtc', () => {
        render(
            <ConfirmDataTypeChangeModal
                {...DEFAULT_PROPS}
                newDataType={multiChoiceType.dataType}
                original={textChoiceType}
            />
        );
        expect(document.body).toHaveTextContent(
            'Confirm Data Type ChangeThis change will convert the values in the field from Text Choice (single select) to Text Choice (multiple select). Filters in saved views might not function as expected and any conditional formatting configured for this field will be removed.'
        );
    });

    test('from mvtc to tc', () => {
        render(
            <ConfirmDataTypeChangeModal
                {...DEFAULT_PROPS}
                newDataType={textChoiceType.dataType}
                original={multiChoiceType}
            />
        );
        expect(document.body).toHaveTextContent(
            'This change will convert the values in the field from Text Choice (multiple select) to Text Choice (single select). Filters in saved views might not function as expected'
        );
    });
});
