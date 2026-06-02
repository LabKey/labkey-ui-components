/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC } from 'react';

interface Props {
    fieldName?: string;
    value: string;
}

const INTERNAL_SPACES_PATTERN = /\S\s\s+\S/;

export const InternalSpacesWarning: FC<Props> = ({ value, fieldName = 'name' }) => {
    if (INTERNAL_SPACES_PATTERN.test(value)) {
        return (
            <span className="text-danger">
                <span className="fa fa-exclamation-circle" /> This {fieldName} contains multiple spaces between words.
                The extra spaces won't be visible to users.
            </span>
        );
    }
    return null;
};

InternalSpacesWarning.displayName = 'InternalSpacesWarning';
