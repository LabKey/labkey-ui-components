/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';

import { Alert } from '../base/Alert';

interface Props {
    archived: boolean;
}

export const ArchivedFolderTag: FC<Props> = memo(({archived}) => {
    if (!archived) return null;
    return <Alert className="folder-field_archived-tag">Archived</Alert>;
});
ArchivedFolderTag.displayName = 'ArchivedFolderTag';
