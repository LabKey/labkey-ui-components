import React, { FC, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { generateId } from './util/utils';
import { useOverlayTriggerState } from './OverlayTrigger';
import { Popover } from './Popover';
import { EMPTY_COMPOUND_WARNING, EMPTY_NS_SEQUENCE_WARNING, EMPTY_PS_SEQUENCE_WARNING } from './constants';
import { SchemaQuery } from '../public/SchemaQuery';
import { SCHEMAS } from './schemas';

function getPopoverMessage(schemaQuery: SchemaQuery): string | undefined {
    if (schemaQuery.isEqual(SCHEMAS.DATA_CLASSES.PROTEIN_SEQUENCE, false)) {
        return EMPTY_PS_SEQUENCE_WARNING;
    } else if (schemaQuery.isEqual(SCHEMAS.DATA_CLASSES.NUC_SEQUENCE, false)) {
        return EMPTY_NS_SEQUENCE_WARNING;
    } else if (schemaQuery.isEqual(SCHEMAS.DATA_CLASSES.COMPOUND, false)) {
        return EMPTY_COMPOUND_WARNING;
    }

    return undefined;
}

interface Props {
    schemaQuery: SchemaQuery;
}

export const UnidentifiedPill: FC<Props> = ({ schemaQuery }) => {
    const id = useMemo(() => generateId('unidentified-sequence-overlay-trigger'), []);
    // Note: we use useOverlayTriggerState instead of OverlayTrigger because the wrapping div from OverlayTrigger
    // causes layout problems.
    const { onMouseEnter, onMouseLeave, portalEl, show, targetRef } = useOverlayTriggerState(id, true, false);
    const message = getPopoverMessage(schemaQuery);

    const popover = useMemo(
        () => (
            <Popover id="unidentified-sequence-popover" placement="top" targetRef={targetRef}>
                <div className="unidentified-sequence-popover">{message}</div>
            </Popover>
        ),
        [message, targetRef]
    );

    return (
        <div
            className="status-pill info unidentified-sequence-pill"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            ref={targetRef}
        >
            Unidentified
            {message && <span className="label-help-icon fa fa-question-circle" />}
            {show && message && createPortal(popover, portalEl)}
        </div>
    );
};
