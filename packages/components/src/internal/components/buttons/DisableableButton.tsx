import React, { memo, FC, useMemo } from 'react';

import { createPortal } from 'react-dom';

import { Popover } from '../../Popover';
import { useOverlayTriggerState } from '../../OverlayTrigger';

interface Props {
    bsStyle?: string;
    className?: string;
    disabledMsg?: string;
    onClick?: () => void;
    title?: string;
}

export const DisableableButton: FC<Props> = memo(props => {
    const { bsStyle = 'default', children, className = '', disabledMsg, onClick, title } = props;
    const { onMouseEnter, onMouseLeave, portalEl, show, targetRef } = useOverlayTriggerState<HTMLButtonElement>(
        'disabled-button-overlay',
        disabledMsg !== undefined,
        false
    );
    const popover = useMemo(
        () => (
            <Popover id="disabled-button-popover" title={title} placement="bottom" targetRef={targetRef}>
                {disabledMsg}
            </Popover>
        ),
        [disabledMsg, targetRef, title]
    );

    // Note: we use onPointerEnter/Leave so events propagate when the button is disabled
    return (
        <button
            className={`${className} btn btn-${bsStyle}`}
            disabled={disabledMsg !== undefined}
            onClick={onClick}
            onPointerEnter={onMouseEnter}
            onPointerLeave={onMouseLeave}
            type="button"
            ref={targetRef}
        >
            {children}
            {show && createPortal(popover, portalEl)}
        </button>
    );
});

DisableableButton.displayName = 'DisableableButton';
