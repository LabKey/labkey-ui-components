/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, PropsWithChildren } from 'react';

import { QueryColumn } from '../../../public/QueryColumn';

export interface Props extends PropsWithChildren {
    column?: QueryColumn;
    description?: string;
    required?: boolean;
    type?: string;
}

export const DOMAIN_FIELD = 'DomainField';

export const DomainFieldHelpTipContents: FC<Props> = props => {
    const { column, children, required, description, type } = props;
    const _description = description ?? (column ? column.description : null);
    const _type = type ?? (column ? column.type : null);
    const _required = required ?? (column ? column.required : null);

    return (
        <>
            {_description && (
                <p className="ws-pre-wrap">
                    <strong>Description </strong>
                    {_description}
                </p>
            )}
            {_type && (
                <p>
                    <strong>Type </strong>
                    {_type}
                </p>
            )}
            {column && column.fieldKey !== column.caption && (
                <p>
                    <strong>Field Key </strong>
                    {column.fieldKey}
                </p>
            )}
            {column?.format && (
                <p>
                    <strong>Display Format </strong>
                    {column.format}
                </p>
            )}
            {column?.phiProtected && <p>PHI protected data removed.</p>}
            {_required && (
                <p>
                    <small>
                        <i>This field is required.</i>
                    </small>
                </p>
            )}
            {children}
        </>
    );
};
DomainFieldHelpTipContents.displayName = 'DomainFieldHelpTipContents';
