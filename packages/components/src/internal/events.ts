/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';

import { KEYS } from './constants';

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
    return isEvent(event) && event.keyCode === KEYS.C && (event.ctrlKey || event.metaKey);
}

function isEvent(event: React.SyntheticEvent<any>): boolean {
    return event !== undefined && event !== null;
}

export function isPaste(event: React.KeyboardEvent<any>): boolean {
    return isEvent(event) && event.keyCode === KEYS.V && (event.ctrlKey || event.metaKey);
}

export function isSelectAll(event: React.KeyboardEvent<any>): boolean {
    return isEvent(event) && event.keyCode === KEYS.A && (event.ctrlKey || event.metaKey);
}

export function setCopyValue(event: any, value: string): boolean {
    if (isEvent(event)) {
        (event.clipboardData || window['clipboardData']).setData('text/plain', value);
        return true;
    }

    return false;
}
