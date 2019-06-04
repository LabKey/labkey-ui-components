/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import moment from 'moment-jdateformatparser'
import numeral from 'numeral'
import { QueryColumn } from "../models/model";

export function datePlaceholder(col: QueryColumn): string {
    let placeholder;

    if (col) {
        const rangeURI = col.rangeURI.toLowerCase();

        // attempt to use the rangeURI to figure out if we are working with a dateTime or date object
        // note Created and Modified columns do not include the rangeURI information
        if (rangeURI.indexOf('datetime') > -1) {
            placeholder = getDateTimeFormat();
        }
        else if (rangeURI.indexOf('date') > -1) {
            placeholder = getDateFormat();
        }
        else {
            placeholder = getDateTimeFormat();
        }
    }

    return placeholder;
}

// 30834: get look and feel display formats
export function getDateFormat(): string {
    return moment().toMomentFormatString(LABKEY.container.formats.dateFormat);
}

function getDateTimeFormat(): string {
    return moment().toMomentFormatString(LABKEY.container.formats.dateTimeFormat);
}

function getNumberFormat(): string {
    return LABKEY.container.formats.numberFormat;
}

// format input/value using look and feel settings
function getFormattedDate(d) {
    return d ? moment(d, getDateFormat()) : d;
}

function getFormattedDateTime(d) {
    return d ? moment(d, getDateTimeFormat()) : d;
}

function getFormattedNumber(n) {
    return n ? numeral(n).format(getNumberFormat()) : n;
}

export function getUnFormattedNumber(n) {
    return n ? numeral(n).value() : n;
}