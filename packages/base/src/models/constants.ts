/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
export const GRID_EDIT_INDEX = '__editing__';
export const GRID_SELECTION_INDEX = '__selection__';

export enum GRID_CHECKBOX_OPTIONS {
    ALL,
    SOME,
    NONE
}

export const PermissionTypes = {
    // CRUD
    Admin: 'org.labkey.api.security.permissions.AdminPermission',
    Delete: 'org.labkey.api.security.permissions.DeletePermission',
    Insert: 'org.labkey.api.security.permissions.InsertPermission',
    Read: 'org.labkey.api.security.permissions.ReadPermission',
    Update: 'org.labkey.api.security.permissions.UpdatePermission',

    // Study
    DesignAssay: 'org.labkey.api.study.permissions.DesignAssayPermission',

    // Assay QC
    QCAnalyst: 'org.labkey.api.security.permissions.QCAnalystPermission',
};