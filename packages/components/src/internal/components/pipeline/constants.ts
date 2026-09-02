/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Map } from 'immutable';

import { FileSizeLimitProps } from '../../../public/files/models';

export const DATA_IMPORT_FILE_SIZE_LIMITS = Map<string, FileSizeLimitProps>({
    all: {
        maxPreviewSize: {
            value: 5242880,
            displayValue: '5MB',
        },
    },
});

export const BACKGROUND_IMPORT_MIN_FILE_SIZE = 1024 * 100; // 100kb
export const BACKGROUND_IMPORT_ASSAY_MIN_FILE_SIZE = 1024 * 500; // 500kb, File sizes chosen to have roughly the same max user wait time. Sample import with storage takes longer than assay import.
export const BACKGROUND_IMPORT_MIN_ROW_SIZE = 1000;
