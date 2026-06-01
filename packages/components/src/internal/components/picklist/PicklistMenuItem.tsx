/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';
import { MAX_SELECTIONS_MESSAGE, MAX_SELECTIONS_PER_ADD } from './constants';
import { DisableableMenuItem } from '../samples/DisableableMenuItem';

interface Props {
    itemText: string;
    open: () => void;
    selectedRowIds: number[] | string[];
}
export const PicklistMenuItem: FC<Props> = memo(({ itemText, open, selectedRowIds }) => {
    const disabled = !selectedRowIds || selectedRowIds.length === 0 || selectedRowIds.length > MAX_SELECTIONS_PER_ADD;
    let disabledMessage: string;

    if (!selectedRowIds || selectedRowIds.length === 0) {
        disabledMessage = 'Select one or more samples.';
    } else if (selectedRowIds.length > MAX_SELECTIONS_PER_ADD) {
        disabledMessage = MAX_SELECTIONS_MESSAGE;
    }

    return (
        <DisableableMenuItem disabled={disabled} disabledMessage={disabledMessage} onClick={open} placement="right">
            {itemText}
        </DisableableMenuItem>
    );
});
PicklistMenuItem.displayName = 'PicklistMenuItem';
