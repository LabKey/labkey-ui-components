/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { ClipboardEvent, KeyboardEvent, MouseEvent, SyntheticEvent } from 'react';

import { KEYS } from './constants';

export function cancelEvent(event: SyntheticEvent<any>): void {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
}

export function getPasteValue(event: ClipboardEvent<any>): string {
    if (isEvent(event)) {
        return (event.clipboardData || window['clipboardData']).getData('text');
    }
}

function isEvent(event: SyntheticEvent<any>): boolean {
    return event !== undefined && event !== null;
}

export function isCtrlOrMetaKey(event: KeyboardEvent<unknown> | MouseEvent<unknown>): boolean {
    return event.ctrlKey || event.metaKey;
}

function isMetaKeyEvent(event: KeyboardEvent<any>, keyCode: number): boolean {
    return isEvent(event) && event.keyCode === keyCode && isCtrlOrMetaKey(event);
}

export const isFillDown = (event: KeyboardEvent<any>): boolean => isMetaKeyEvent(event, KEYS.D);
export const isSelectAll = (event: KeyboardEvent<any>): boolean => isMetaKeyEvent(event, KEYS.A);

export function setCopyValue(event: any, value: string): boolean {
    if (isEvent(event)) {
        (event.clipboardData || window['clipboardData']).setData('text/plain', value);
        return true;
    }

    return false;
}
