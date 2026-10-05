/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';

interface Props {
    discardTitle?: string;
    shouldDiscard: boolean;
    toggleShouldDiscard: () => void;
}

export const DISCARD_CONSUMED_CHECKBOX_FIELD = 'discardcheckbox';

export const DiscardConsumedSamplesPanel: FC<Props> = memo(props => {
    const { discardTitle = 'Remove Sample(s) from Storage?', shouldDiscard, toggleShouldDiscard } = props;

    // TODO: Make clicking the discardTitle check the checkbox!
    return (
        <div className="form-group">
            <label className="form-check">
                <input
                    checked={shouldDiscard}
                    className="form-check-input"
                    id={DISCARD_CONSUMED_CHECKBOX_FIELD}
                    name={DISCARD_CONSUMED_CHECKBOX_FIELD}
                    onChange={toggleShouldDiscard}
                    type="checkbox"
                />
                <span className="discard-consumed-title"> {discardTitle}</span>
            </label>
        </div>
    );
});
DiscardConsumedSamplesPanel.displayName = 'DiscardConsumedSamplesPanel';
