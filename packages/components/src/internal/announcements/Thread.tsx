import React, { FC, useCallback, useState } from 'react';

import { ThreadBlock, ThreadBlockProps } from './ThreadBlock';

export const Thread: FC<ThreadBlockProps> = props => {
    const { thread } = props;
    const { responses } = thread;
    const [ responseToggle, setResponseToggle ] = useState(false);
    const showResponses = responseToggle && responses.length > 0;

    const toggleResponses = useCallback(() => {
        setResponseToggle(!responseToggle);
    }, [setResponseToggle, responseToggle]);

    return (
        <div className="thread-container">
            <ThreadBlock {...props} onToggleResponses={toggleResponses} showResponses={responseToggle} />
            {showResponses && (
                <div className="thread-responses-container">
                    {responses.map(response => (
                        <Thread
                            {...props}
                            canReply={false}
                            key={response.rowId}
                            parent={thread.entityId}
                            thread={response}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
