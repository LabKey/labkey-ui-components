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
export const GRID_EDIT_INDEX = '__editing__';
export const GRID_SELECTION_INDEX = '__selection__';

export enum GRID_CHECKBOX_OPTIONS {
    ALL,
    SOME,
    NONE,
}

export const PermissionTypes = {
    // CRUD
    Admin: 'org.labkey.api.security.permissions.AdminPermission',
    Delete: 'org.labkey.api.security.permissions.DeletePermission',
    Insert: 'org.labkey.api.security.permissions.InsertPermission',
    Read: 'org.labkey.api.security.permissions.ReadPermission',
    Update: 'org.labkey.api.security.permissions.UpdatePermission',

    // Other
    DesignAssay: 'org.labkey.api.assay.security.DesignAssayPermission',
    DesignDataClass: 'org.labkey.api.security.permissions.DesignDataClassPermission',
    DesignSampleSet: 'org.labkey.api.security.permissions.DesignSampleSetPermission',
    DesignList: 'org.labkey.api.lists.permissions.DesignListPermission',
    UserManagement: 'org.labkey.api.security.permissions.UserManagementPermission',
    ApplicationAdmin: 'org.labkey.api.security.permissions.ApplicationAdminPermission',

    // Assay QC
    QCAnalyst: 'org.labkey.api.security.permissions.QCAnalystPermission',
};
