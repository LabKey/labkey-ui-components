/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useCallback, useState } from 'react';

import { ThreadBlock, ThreadBlockProps } from './ThreadBlock';

export const Thread: FC<ThreadBlockProps> = props => {
    const { thread } = props;
    const { responses } = thread;
    const [responseToggle, setResponseToggle] = useState(false);
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
Thread.displayName = 'Thread';
