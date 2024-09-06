import React, { FC } from 'react';

import { LoadingSpinner } from '../base/LoadingSpinner';

export interface NameExpressionPreviewProps {
    isPreviewLoading?: boolean;
    previewName?: string;
}

export const NameExpressionPreview: FC<NameExpressionPreviewProps> = props => {
    const { isPreviewLoading, previewName } = props;

    const isValidExpression = isPreviewLoading || !!previewName;
    if (!isValidExpression) {
        return <p>Unable to generate example name from the current pattern. Check for syntax errors.</p>;
    }

    return (
        <p>
            Example of name that will be generated from the current pattern:&nbsp;
            {previewName ? previewName : <LoadingSpinner />}
        </p>
    );
};

NameExpressionPreview.displayName = 'NameExpressionPreview';
