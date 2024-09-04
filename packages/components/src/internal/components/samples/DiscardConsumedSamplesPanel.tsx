import React, { FC, memo } from 'react';

import { CommentTextArea } from '../forms/input/CommentTextArea';
import { useDataChangeCommentsRequired } from '../forms/input/useDataChangeCommentsRequired';

interface Props {
    comment?: string;
    discardTitle?: string;
    onCommentChange?: (comment: string) => void;
    shouldDiscard: boolean;
    toggleShouldDiscard: () => void;
}

export const DISCARD_CONSUMED_CHECKBOX_FIELD = 'discardcheckbox';

export const DiscardConsumedSamplesPanel: FC<Props> = memo(props => {
    const {
        discardTitle = 'Discard Sample(s) from Storage?',
        shouldDiscard,
        toggleShouldDiscard,
        onCommentChange,
        comment,
    } = props;
    const { requiresUserComment } = useDataChangeCommentsRequired();

    return (
        <>
            <div className="form-group">
                <div className="form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id={DISCARD_CONSUMED_CHECKBOX_FIELD}
                        name={DISCARD_CONSUMED_CHECKBOX_FIELD}
                        onChange={toggleShouldDiscard}
                        checked={shouldDiscard}
                    />
                    <span className="discard-consumed-title left-spacing">{discardTitle}</span>
                </div>
            </div>
            {onCommentChange && (
                <CommentTextArea
                    onChange={onCommentChange}
                    disabled={!shouldDiscard}
                    actionName="Discarding"
                    containerClassName="top-spacing bottom-spacing"
                    requiresUserComment={requiresUserComment}
                    value={comment}
                />
            )}
        </>
    );
});

DiscardConsumedSamplesPanel.displayName = 'DiscardConsumedSamplesPanel';
