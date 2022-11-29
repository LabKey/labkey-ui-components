import React, { FC, memo } from 'react';
import { Col, Row } from 'react-bootstrap';

interface Props {
    shouldDiscard: boolean;
    onCommentChange: (event) => any;
    toggleShouldDiscard: () => any;
    discardTitle?: string;
}

export const DISCARD_CONSUMED_CHECKBOX_FIELD = 'discardcheckbox';
export const DISCARD_CONSUMED_COMMENT_FIELD = 'discardcomments';

export const DiscardConsumedSamplesPanel: FC<Props> = memo(props => {
    const { discardTitle, shouldDiscard, toggleShouldDiscard, onCommentChange } = props;

    return (
        <>
            <Row>
                <Col xs={5}>
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
                            <span className="left-spacing">{discardTitle}</span>
                        </div>
                    </div>
                </Col>
                <Col xs={7} />
            </Row>
            <div className="form-group">
                <div className="storage-item-data">Reason for discarding</div>
                <textarea
                    className="form-control"
                    id={DISCARD_CONSUMED_COMMENT_FIELD}
                    name={DISCARD_CONSUMED_COMMENT_FIELD}
                    placeholder="Enter comments (optional)"
                    rows={5}
                    onChange={onCommentChange}
                    disabled={!shouldDiscard}
                />
            </div>
        </>
    );
});

DiscardConsumedSamplesPanel.defaultProps = {
    discardTitle: 'Discard sample?',
};
