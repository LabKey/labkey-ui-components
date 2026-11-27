/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useMemo } from 'react';

import { createPortal } from 'react-dom';

import { LoadingState } from '../../../public/LoadingState';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { MenuItem } from '../../dropdowns';
import { useOverlayTriggerState } from '../../OverlayTrigger';
import { Popover } from '../../Popover';
import { AppURL } from '../../url/AppURL';
import { Placement } from '../../useOverlayPositioning';

interface Props {
    href?: AppURL | string;
    maxSelection?: number;
    maxSelectionDisabledMsg?: string;
    nounPlural: string; // always used, doesn't need default value
    onClick?: () => void;
    popoverPlacement?: Placement;
    queryModel: QueryModel;
    text: React.ReactNode;
}

interface DisabledSelectionMenuItemProps {
    message: string;
    popoverPlacement?: Placement;
    text: React.ReactNode;
}

export const DisabledSelectionMenuItem: FC<DisabledSelectionMenuItemProps> = ({
    message,
    text,
    popoverPlacement = 'right',
}) => {
    const { onMouseEnter, onMouseLeave, portalEl, show, targetRef } = useOverlayTriggerState<HTMLLIElement>(
        'disabled-selection-menu-item',
        true,
        false
    );
    const overlay = useMemo(
        () => (
            <Popover id="disabled-selection-menu-item-popover" placement={popoverPlacement} targetRef={targetRef}>
                {message}
            </Popover>
        ),
        [message, popoverPlacement, targetRef]
    );
    // Keyboard and screen reader users get the reason via focus and aria-description, not just hover
    return (
        <MenuItem
            aria-description={message}
            disabled
            onBlur={onMouseLeave}
            onFocus={onMouseEnter}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            ref={targetRef}
        >
            {text}
            {show && createPortal(overlay, portalEl)}
        </MenuItem>
    );
};
DisabledSelectionMenuItem.displayName = 'DisabledSelectionMenuItem';

export const SelectionMenuItem: FC<Props> = props => {
    const { href, maxSelection, maxSelectionDisabledMsg, nounPlural, onClick, popoverPlacement, queryModel, text } =
        props;
    const selectionSize = queryModel?.selections?.size;
    let disabledMessage: string;

    // Selections that were never requested leave the item enabled, since not every caller loads them
    if (selectionSize === undefined) {
        if (queryModel?.selectionsLoadingState === LoadingState.LOADING) {
            disabledMessage = 'Loading selections...';
        } else if (queryModel?.selectionsError) {
            disabledMessage = `Select one or more ${nounPlural}.`;
        }
    } else if (selectionSize === 0) {
        disabledMessage = `Select one or more ${nounPlural}.`;
    } else if (selectionSize > maxSelection) {
        disabledMessage =
            maxSelectionDisabledMsg || `At most ${maxSelection?.toLocaleString()} ${nounPlural} can be selected.`;
    }

    if (disabledMessage) {
        return <DisabledSelectionMenuItem message={disabledMessage} popoverPlacement={popoverPlacement} text={text} />;
    }

    return (
        <MenuItem href={href} onClick={onClick}>
            {text}
        </MenuItem>
    );
};
SelectionMenuItem.displayName = 'SelectionMenuItem';
