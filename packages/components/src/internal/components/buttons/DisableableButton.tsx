/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, PropsWithChildren, useMemo } from 'react';

import { createPortal } from 'react-dom';

import { Popover } from '../../Popover';
import { useOverlayTriggerState } from '../../OverlayTrigger';

interface Props extends PropsWithChildren {
    bsStyle?: string;
    className?: string;
    disabledMsg?: string;
    onClick?: () => void;
    placement?: 'bottom' | 'left' | 'right' | 'top';
    title?: string;
}

export const DisableableButton: FC<Props> = memo(props => {
    const { bsStyle = 'default', children, className = '', disabledMsg, onClick, placement = 'bottom', title } = props;
    const { onMouseEnter, onMouseLeave, portalEl, show, targetRef } = useOverlayTriggerState<HTMLButtonElement>(
        'disabled-button-overlay',
        disabledMsg !== undefined,
        false
    );
    const popover = useMemo(
        () => (
            <Popover id="disabled-button-popover" placement={placement} targetRef={targetRef} title={title}>
                {disabledMsg}
            </Popover>
        ),
        [disabledMsg, placement, targetRef, title]
    );

    // Note: we use onPointerEnter/Leave so events propagate when the button is disabled
    return (
        <button
            className={`${className} btn btn-${bsStyle}`}
            disabled={disabledMsg !== undefined}
            onClick={onClick}
            onPointerEnter={onMouseEnter}
            onPointerLeave={onMouseLeave}
            ref={targetRef}
            type="button"
        >
            {children}
            {show && createPortal(popover, portalEl)}
        </button>
    );
});

DisableableButton.displayName = 'DisableableButton';
