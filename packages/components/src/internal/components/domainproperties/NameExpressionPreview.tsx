import React, { FC, useCallback, useState } from 'react';

import { LoadingSpinner } from '../base/LoadingSpinner';

export interface NameExpressionPreviewProps {
    chatHelp?: string;
    errors?: string[];
    isPreviewLoading?: boolean;
    previewName?: string;
}

export const NameExpressionPreview: FC<NameExpressionPreviewProps> = props => {
    const { chatHelp, isPreviewLoading, previewName, errors } = props;
    const isValidExpression = isPreviewLoading || !!previewName;
    const [showChatResponse, setShowChatResponse] = useState<boolean>(false);

    const getMoreHelp = useCallback(() => {
        setShowChatResponse(true);
    }, []);

    if (!isValidExpression) {
        return (
            <div>
                Unable to generate example name from the current pattern. Check for syntax errors.
                <div className="margin-top"><span className="bold-text">Details </span> {errors}</div>
                {chatHelp && !showChatResponse && (
                    <div className="margin-top">
                        <button className="btn btn-default"  onClick={getMoreHelp}>Get More Help</button>
                    </div>
                )}
                {showChatResponse && (
                    <div className="margin-top">{chatHelp}</div>
                )}
            </div>
        );
    }

    return (
        <p>
            Example of name that will be generated from the current pattern:&nbsp;
            {previewName ? previewName : <LoadingSpinner />}
        </p>
    );
};

NameExpressionPreview.displayName = 'NameExpressionPreview';
