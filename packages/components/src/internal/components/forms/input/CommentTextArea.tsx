import React, { FC } from 'react';

interface Props {
    actionName: string;
    onChange: (event) => void;
    containerClassName?: string;
    requiresUserComment?: boolean;
}

export const CommentTextArea: FC<Props> = (props) => {
    const { actionName, containerClassName, onChange, requiresUserComment } = props;

    return (
        <div className={containerClassName}>
            <label>Reason for {actionName}{requiresUserComment ? ' *' : ''}</label>
            <textarea
                className="form-control"
                id="actionComments"
                placeholder={'Enter reason ' + (requiresUserComment ? '(required)' : '(optional)')}
                rows={5}
                onChange={onChange}
            />
        </div>
    );
};

CommentTextArea.defaultProps = {
    containerClassName: 'top-spacing',
};
