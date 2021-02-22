import { InferDomainResponse } from '../..';

export interface FileSizeLimitProps {
    maxSize?: {
        value: number;
        displayValue: string;
    };
    maxPreviewSize?: {
        value: number;
        displayValue: string;
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
}
