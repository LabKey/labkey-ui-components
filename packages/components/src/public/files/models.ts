/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { ReactNode } from 'react';

import { InferDomainResponse } from '../InferDomainResponse';

export interface FileSizeLimitProps {
    maxPreviewSize?: {
        displayValue: string;
        value: number;
    };
    maxSize?: {
        displayValue: string;
        value: number;
    };
    totalSize?: {
        displayValue: string;
        value: number;
    };
}

export interface FileGridPreviewProps {
    acceptedFormats?: string; // comma-separated list of allowed extensions i.e. '.png, .jpg, .jpeg'
    distinctValueColumns?: string[];
    domainKindName?: string;
    errorStyle?: string;
    header?: string;
    infoMsg?: any;
    initialData?: InferDomainResponse;
    onPreviewLoad?: (response: InferDomainResponse, fileData?: File) => any;
    previewCount: number;
    skipPreviewGrid?: boolean;
    warningMsg?: ReactNode;
}
