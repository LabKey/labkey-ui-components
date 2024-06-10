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
