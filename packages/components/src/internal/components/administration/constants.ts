/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { PermissionRoles } from '@labkey/api';
import { Map } from 'immutable';

export const SITE_SECURITY_ROLES = Map<string, string>([
    [PermissionRoles.ApplicationAdmin, 'Application Administrator'],
]);

export const APPLICATION_SECURITY_ROLES = Map<string, string>([
    [PermissionRoles.ProjectAdmin, 'Project Administrator'],
    [PermissionRoles.FolderAdmin, 'Folder Administrator'],
    [PermissionRoles.Editor, 'Editor'],
    [PermissionRoles.EditorWithoutDelete, 'Editor without Delete'],
    [PermissionRoles.Reader, 'Reader'],
]);

export const ASSAY_DESIGNER_ROLE = 'org.labkey.assay.security.AssayDesignerRole';
export const DATA_CLASS_DESIGNER_ROLE = 'org.labkey.experiment.security.DataClassDesignerRole';
export const SAMPLE_TYPE_DESIGNER_ROLE = 'org.labkey.experiment.security.SampleTypeDesignerRole';

export const APPLICATION_ROLES_LABELS = {
    [DATA_CLASS_DESIGNER_ROLE]: 'Source Type Designer',
};
export const APPLICATION_ROLES_DESCRIPTIONS = {
    [DATA_CLASS_DESIGNER_ROLE]:
        'Source type designers can create and design new source types or change existing ones.',
};
