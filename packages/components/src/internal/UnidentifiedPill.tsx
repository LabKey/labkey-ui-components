import React, { FC, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { generateId } from './util/utils';
import { useOverlayTriggerState } from './OverlayTrigger';
import { Popover } from './Popover';
import { EMPTY_SEQUENCE_WARNING } from './constants';

export const UnidentifiedPill: FC = () => {
    const id = useMemo(() => generateId('unidentified-sequence-overlay-trigger'), []);
    // Note: we use useOverlayTriggerState instead of OverlayTrigger because the wrapping div from OverlayTrigger
    // causes layout problems.
    const { onMouseEnter, onMouseLeave, portalEl, show, targetRef } = useOverlayTriggerState(id, true, false);

    const popover = useMemo(
        () => (
            <Popover id="unidentified-sequence-popover" placement="top" targetRef={targetRef}>
                <div className="unidentified-sequence-popover">{EMPTY_SEQUENCE_WARNING}</div>
            </Popover>
        ),
        [targetRef]
    );

    return (
        <div
            className="status-pill info unidentified-sequence-pill"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            ref={targetRef}
        >
            Unidentified
            <span className="label-help-icon fa fa-question-circle" />
            {show && createPortal(popover, portalEl)}
        </div>
    );
};
