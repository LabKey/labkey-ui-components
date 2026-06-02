/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
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
