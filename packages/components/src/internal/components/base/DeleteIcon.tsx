/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback } from 'react';
import { useEnterEscape } from '../../../public/useEnterEscape';

interface Props {
    className?: string;
    iconCls: string;
    id?: string;
    onDelete: () => void;
    title: string;
}

export const DeleteIcon: FC<Props> = memo(({ id, title, className = 'field-icon', onDelete, iconCls }) => {
    const callOnDelete = useCallback(() => {
        onDelete();
    }, [onDelete]);
    const onKeyDown = useEnterEscape(callOnDelete);

    return (
        <span className={className} id={id} onClick={callOnDelete} onKeyDown={onKeyDown} tabIndex={0} title={title}>
            <span className={`fa fa-times-circle ${iconCls}`} />
        </span>
    );
});
DeleteIcon.displayName = 'DeleteIcon';
