/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'

import { KEYS } from './constants'

export function cancelEvent(event: React.SyntheticEvent<any>): void {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
}

export function getPasteValue(event: React.ClipboardEvent<any>): string {
    if (isEvent(event)) {
        return (event.clipboardData || window['clipboardData']).getData('text');
    }
}

export function isCopy(event: React.KeyboardEvent<any>): boolean {
    return isEvent(event) && (event.keyCode === KEYS.C && (event.ctrlKey || event.metaKey));
}

function isEvent(event: React.SyntheticEvent<any>): boolean {
    return event !== undefined && event !== null;
}

export function isPaste(event: React.KeyboardEvent<any>): boolean {
    return isEvent(event) && (event.keyCode === KEYS.V && (event.ctrlKey || event.metaKey));
}

export function isSelectAll(event: React.KeyboardEvent<any>): boolean {
    return isEvent(event) && (event.keyCode === KEYS.A && (event.ctrlKey || event.metaKey));
}

export function setCopyValue(event: any, value: string): boolean {
    if (isEvent(event)) {
        (event.clipboardData || window['clipboardData']).setData('text/plain', value);
        return true;
    }

    return false;
}