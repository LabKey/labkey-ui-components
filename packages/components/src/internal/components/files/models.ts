/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map } from 'immutable';

import { DomainField } from '../domainproperties/models';

export interface FileAttachmentFormModel {
    addAttachedFile?: (any) => any;
    attachedFiles?: Map<string, File>;
    isSubmitting?: boolean;
    removeAttachedFile?: (any) => any;
}

export interface IFile {
    canDelete: boolean;
    canEdit: boolean;
    canRead: boolean;
    canRename: boolean;
    canUpload: boolean;
    contentLength: number;
    contentType: string;
    created: string;
    createdBy: string;
    createdById: number;
    dataFileUrl: string;
    description: string;
    downloadUrl: string;
    href: string;
    iconFontCls: string;
    id: string;
    isCollection: boolean;
    isLeaf: boolean;
    lastModified: string;
    name: string;
    options: string;
    propertiesRowId?: number;
}

export const DEFAULT_FILE: IFile = {
    canDelete: false,
    canEdit: false,
    canRead: false,
    canRename: false,
    canUpload: false,
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
};

export interface SimpleResponse {
    fields?: List<DomainField>;
    loading?: boolean;
    msg?: string;
    success: boolean;
}

export const ALL_FILES_LIMIT_KEY = 'all';
