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
    previewCount: number;
    header?: string;
    infoMsg?: any;
    onPreviewLoad?: (response: InferDomainResponse, fileData?: File) => any;
    acceptedFormats?: string; // comma-separated list of allowed extensions i.e. '.png, .jpg, .jpeg'
    initialData?: InferDomainResponse;
    skipPreviewGrid?: boolean;
    errorStyle?: string;
    domainKindName?: string;
    warningMsg?: ReactNode;
}
