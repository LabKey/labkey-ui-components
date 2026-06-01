/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
const DESCRIPTION_FIELD = {
    Name: 'Description',
    Label: 'Description',
    DataType: 'Text',
    Required: false,
    Description: 'Contains a description for this data object',
    Disableable: true,
};

export const DATACLASS_DOMAIN_SYSTEM_FIELDS = [
    {
        Name: 'Name',
        Label: 'Name',
        DataType: 'Text',
        Required: true,
        Description: 'Contains a short name for this data object',
        Disableable: false,
    },
    DESCRIPTION_FIELD,
];

export const SOURCE_DOMAIN_SYSTEM_FIELDS = [
    {
        Name: 'Name',
        Label: 'Source ID',
        DataType: 'Text',
        Required: true,
        Description: 'Contains a short name for this data object',
        Disableable: false,
    },
    DESCRIPTION_FIELD,
];
