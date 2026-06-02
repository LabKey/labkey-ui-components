/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { userEvent } from '@testing-library/user-event';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { isValidAltDateTimeFormatOptions } from '../../util/Date';

import { AppContextTestProviderProps } from '../../test/testHelpers';

import { createFormInputId } from './utils';
import { DOMAIN_FIELD_FORMAT, DOMAIN_FIELD_NOT_LOCKED } from './constants';
import { DateTimeFieldOptions } from './DateTimeFieldOptions';

const DEFAULT_PROP = {
    index: 1,
    domainIndex: 1,
    label: 'Date and Time Field Options',
    onChange: jest.fn(),
    lockType: DOMAIN_FIELD_NOT_LOCKED,
    type: 'dateTime',
};

const CONTEXT: AppContextTestProviderProps = {
    serverContext: {
        // @ts-expect-error partial container properties
        container: {
            formats: {
                dateFormat: 'yyyy-MM-dd',
                dateTimeFormat: 'yyyy-MM-dd HH:mm',
                numberFormat: undefined,
                timeFormat: 'HH:mm',
            },
        },
    },
};

function verifyInputs(
    type: string,
    inherit: boolean,
    date: string = 'yyyy-MM-dd',
    time: string = 'HH:mm',
    dateInvalid?: boolean,
    timeInvalid?: boolean
): void {
    expect(document.querySelector('.domain-field-section-heading')).toHaveTextContent(DEFAULT_PROP.label);
    const inheritCheckboxId = createFormInputId(
        DOMAIN_FIELD_FORMAT + '_inherit' + type,
        DEFAULT_PROP.domainIndex,
        DEFAULT_PROP.index
    );
    const checkbox = document.getElementById(inheritCheckboxId);
    if (inherit) {
        expect(checkbox).toBeChecked();
    } else {
        expect(checkbox).not.toBeChecked();
    }

    const selectInputs = document.querySelectorAll('.select-input__control');
    expect(selectInputs.length).toEqual(type === 'dateTime' ? 2 : 1);
    expect(selectInputs[0].hasAttribute('aria-disabled')).toEqual(inherit);

    const skipDatePreview = dateInvalid || isValidAltDateTimeFormatOptions(date);
    const skipTimePreview = timeInvalid || isValidAltDateTimeFormatOptions(time);
    if (type === 'dateTime') {
        expect(selectInputs[1].hasAttribute('aria-disabled')).toEqual(inherit);
        expect(selectInputs[0].textContent.startsWith(date + (skipDatePreview ? '' : ' ('))).toBeTruthy();
        expect(
            selectInputs[1].textContent.startsWith(time ? time + (skipTimePreview ? '' : ' (') : '<none>')
        ).toBeTruthy();
    } else if (type === 'date') {
        expect(selectInputs[0].textContent.startsWith(date + (skipDatePreview ? '' : ' ('))).toBeTruthy();
    } else {
        expect(selectInputs[0].textContent.startsWith(time + (skipTimePreview ? '' : ' ('))).toBeTruthy();
    }

    expect(document.querySelectorAll('.fa-exclamation-circle')).toHaveLength(dateInvalid || timeInvalid ? 1 : 0);
}

describe('DateTimeFieldOptions', () => {
    function clickCheckbox(): Promise<void> {
        return userEvent.click(document.querySelector('input[type="checkbox"]'));
    }

    test('DateTime type, no format', async () => {
        renderWithAppContext(<DateTimeFieldOptions {...DEFAULT_PROP} format={undefined} type="dateTime" />, CONTEXT);

        verifyInputs('dateTime', true);

        await clickCheckbox();
        expect(DEFAULT_PROP.onChange).toHaveBeenCalledTimes(1);
    });

    test('DateTime type, with valid format', () => {
        renderWithAppContext(
            <DateTimeFieldOptions {...DEFAULT_PROP} format="yyyy-MMM-dd hh:mm a" type="dateTime" />,
            CONTEXT
        );

        verifyInputs('dateTime', false, 'yyyy-MMM-dd', 'hh:mm a', false, false);
    });

    test('DateTime type, with invalid date format', async () => {
        renderWithAppContext(
            <DateTimeFieldOptions {...DEFAULT_PROP} format="yyyy/MM/dd hh:mm a" type="dateTime" />,
            CONTEXT
        );

        verifyInputs('dateTime', false, 'yyyy/MM/dd hh:mm a', '', true, false);

        // toggle to inherit, should get rid of warning
        await clickCheckbox();
        expect(DEFAULT_PROP.onChange).toHaveBeenCalledTimes(2);
        expect(document.querySelectorAll('.fa-exclamation-circle')).toHaveLength(0);
    });

    test('DateTime type, with invalid time format', async () => {
        renderWithAppContext(
            <DateTimeFieldOptions {...DEFAULT_PROP} format="yyyy-MMM-dd hh:mm aa" type="dateTime" />,
            CONTEXT
        );

        verifyInputs('dateTime', false, 'yyyy-MMM-dd hh:mm aa', '', true, false);

        // toggle to inherit, should get rid of warning
        await clickCheckbox();
        expect(DEFAULT_PROP.onChange).toHaveBeenCalledTimes(3);
        expect(document.querySelectorAll('.fa-exclamation-circle')).toHaveLength(0);
    });

    test('DateTime type, with valid date and empty time', () => {
        renderWithAppContext(<DateTimeFieldOptions {...DEFAULT_PROP} format="yyyy-MMM-dd" type="dateTime" />, CONTEXT);

        verifyInputs('dateTime', false, 'yyyy-MMM-dd', '');
    });

    test('Date type, with override', () => {
        renderWithAppContext(<DateTimeFieldOptions {...DEFAULT_PROP} format="ddMMMyyyy" type="date" />, CONTEXT);

        verifyInputs('date', false, 'ddMMMyyyy', null, false, false);
    });

    test('Date type, with invalid override', async () => {
        renderWithAppContext(<DateTimeFieldOptions {...DEFAULT_PROP} format="ddMMM-yyyy" type="date" />, CONTEXT);

        verifyInputs('date', false, 'ddMMM-yyyy', null, true, false);
        // toggle to inherit, should get rid of warning
        await clickCheckbox();
        expect(DEFAULT_PROP.onChange).toHaveBeenCalledTimes(4);
        expect(document.querySelectorAll('.fa-exclamation-circle')).toHaveLength(0);
    });

    test('Date type, with alternative format override', () => {
        renderWithAppContext(<DateTimeFieldOptions {...DEFAULT_PROP} format="dateTime" type="date" />, CONTEXT);

        verifyInputs('date', false, 'dateTime', null, false, false);
    });

    test('Time type, with invalid override', async () => {
        renderWithAppContext(<DateTimeFieldOptions {...DEFAULT_PROP} format="kk:mm" type="time" />, CONTEXT);

        verifyInputs('time', false, null, 'kk:mm', false, true);
        // toggle to inherit, should get rid of warning
        await clickCheckbox();
        expect(DEFAULT_PROP.onChange).toHaveBeenCalledTimes(5);
        expect(document.querySelectorAll('.fa-exclamation-circle')).toHaveLength(0);
    });

    test('Time type, with empty time', () => {
        renderWithAppContext(<DateTimeFieldOptions {...DEFAULT_PROP} format="" type="time" />, CONTEXT);

        verifyInputs('time', true, null, 'HH:mm');
    });
});
