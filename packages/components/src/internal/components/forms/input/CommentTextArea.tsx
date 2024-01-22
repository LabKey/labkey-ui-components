import React, { FC } from 'react';

interface Props {
    actionName: string;
    disabled?: boolean;
    onChange: (event) => void;
    containerClassName?: string;
    requiresUserComment?: boolean;
}

export const COMMENT_FIELD_ID = "actionComments";

export const CommentTextArea: FC<Props> = (props) => {
    const { actionName, containerClassName, disabled, onChange, requiresUserComment } = props;

    return (
        <div className={containerClassName}>
            <label>Reason for {actionName}{requiresUserComment ? ' *' : ''}</label>
            <textarea
                className="form-control"
                id={COMMENT_FIELD_ID}
                placeholder={'Enter reason ' + (requiresUserComment ? '(required)' : '(optional)')}
                rows={5}
                disabled={disabled}
                onChange={onChange}
            />
        </div>
    );
};

CommentTextArea.defaultProps = {
    containerClassName: 'top-spacing',
};
