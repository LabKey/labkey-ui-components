/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useMemo } from 'react';

import { createPortal } from 'react-dom';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { MenuItem } from '../../dropdowns';
import { useOverlayTriggerState } from '../../OverlayTrigger';
import { Popover } from '../../Popover';
import { AppURL } from '../../url/AppURL';

interface Props {
    href?: string | AppURL;
    maxSelection?: number;
    maxSelectionDisabledMsg?: string;
    nounPlural: string; // always used, doesn't need default value
    onClick?: () => void;
    queryModel: QueryModel;
    text: React.ReactNode;
}

interface DisabledSelectionMenuItemProps {
    message: string;
    text: React.ReactNode;
}

export const DisabledSelectionMenuItem: FC<DisabledSelectionMenuItemProps> = ({ message, text }) => {
    const { onMouseEnter, onMouseLeave, portalEl, show, targetRef } = useOverlayTriggerState<HTMLLIElement>(
        'disabled-selection-menu-item',
        true,
        false
    );
    const overlay = useMemo(
        () => (
            <Popover placement="right" id="disabled-selection-menu-item-popover" targetRef={targetRef}>
                {message}
            </Popover>
        ),
        [message, targetRef]
    );
    return (
        <MenuItem disabled onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} ref={targetRef}>
            {text}
            {show && createPortal(overlay, portalEl)}
        </MenuItem>
    );
};
DisabledSelectionMenuItem.displayName = 'DisabledSelectionMenuItem';

export const SelectionMenuItem: FC<Props> = props => {
    const { href, maxSelection, maxSelectionDisabledMsg, nounPlural, onClick, queryModel, text } = props;
    const selectionSize = queryModel?.selections?.size;
    const { tooFewSelected, tooManySelected } = useMemo(
        () => ({
            tooFewSelected: selectionSize !== undefined && selectionSize === 0,
            tooManySelected: selectionSize !== undefined && selectionSize > maxSelection,
        }),
        [maxSelection, selectionSize]
    );
    const disabled = tooFewSelected || tooManySelected;

    if (disabled) {
        const message = tooFewSelected
            ? `Select one or more ${nounPlural}.`
            : maxSelectionDisabledMsg || `At most ${maxSelection?.toLocaleString()} ${nounPlural} can be selected.`;
        return <DisabledSelectionMenuItem message={message} text={text} />;
    }

    return (
        <MenuItem href={href} onClick={onClick}>
            {text}
        </MenuItem>
    );
};
SelectionMenuItem.displayName = 'SelectionMenuItem';
