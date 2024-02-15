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
export const BACKGROUND_IMPORT_MIN_ROW_SIZE = 1000;
