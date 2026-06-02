/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { SchemaQuery } from '../public/SchemaQuery';

export function createGridModelId(gridId: string, schemaQuery: SchemaQuery, keyValue?: any): string {
    const parts = [gridId, schemaQuery.getKey()];
    if (keyValue !== undefined) {
        parts.push(keyValue);
    }

    return parts.join('|').toLowerCase();
}
