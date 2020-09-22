/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Map } from 'immutable';

export interface FileAttachmentFormModel {
    addAttachedFile?: (any) => any;
    attachedFiles?: Map<string, File>;
    isSubmitting?: boolean;
    removeAttachedFile?: (any) => any;
}

export interface IFile {
    contentLength: number;
    contentType: string;
    created: string;
    createdBy: string;
    createdById: number;
    dataFileUrl: string;
    description: string;
    downloadUrl: string;
    href: string;
    id: string;
    iconFontCls: string;
    isCollection: boolean;
    isLeaf: boolean;
    lastModified: string;
    name: string;
    options: string;
    propertiesRowId?: number;
    canDelete: boolean;
    canEdit: boolean;
    canRead: boolean;
    canRename: boolean;
    canUpload: boolean;
}

export const DEFAULT_FILE: IFile = {
    contentLength: 0,
    contentType: undefined,
    created: undefined,
    createdBy: undefined,
    createdById: -1,
    dataFileUrl: undefined,
    description: undefined,
    downloadUrl: undefined,
    href: undefined,
    id: undefined,
    iconFontCls: undefined,
    isCollection: false,
    isLeaf: false,
    lastModified: undefined,
    name: undefined,
    options: undefined,
    propertiesRowId: undefined,
    canDelete: false,
    canEdit: false,
    canRead: false,
    canRename: false,
    canUpload: false,
};

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
export const ALL_FILES_LIMIT_KEY = 'all';
