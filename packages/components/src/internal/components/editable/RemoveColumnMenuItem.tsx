/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback } from 'react';

import { MenuItem } from '../../dropdowns';
import { QueryColumn } from '../../../public/QueryColumn';

interface Props {
    column: QueryColumn;
    onClick: (column: QueryColumn) => void;
}

export const RemoveColumnMenuItem: FC<Props> = memo(({ column, onClick }) => {
    const onClick_ = useCallback(() => onClick(column), [column, onClick]);
    return <MenuItem onClick={onClick_}>Remove Column</MenuItem>;
});
RemoveColumnMenuItem.displayName = 'RemoveColumnMenuItem';
