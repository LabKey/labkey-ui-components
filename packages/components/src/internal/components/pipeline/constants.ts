import { Map } from 'immutable';
import { Filter } from '@labkey/api';

import { FileSizeLimitProps } from '../../../public/files/models';

const SAMPLES_IMPORT_PIPELINE_PROVIDER = 'Samples Import';
const SOURCES_IMPORT_PIPELINE_PROVIDER = 'Sources Import';

const PROVIDERS_LKB = [SAMPLES_IMPORT_PIPELINE_PROVIDER, 'General', 'ETL'];
export const PIPELINE_PROVIDER_FILTER_LKB = Filter.create('Provider', PROVIDERS_LKB, Filter.Types.IN);

const PROVIDERS_LKSM = [...PROVIDERS_LKB, SOURCES_IMPORT_PIPELINE_PROVIDER];
export const PIPELINE_PROVIDER_FILTER_LKSM = Filter.create('Provider', PROVIDERS_LKSM, Filter.Types.IN);

export const ACTIVE_JOB_INDICATOR_CLS = 'fa-spinner fa-pulse';

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
