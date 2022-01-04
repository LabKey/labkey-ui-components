import { Map } from 'immutable';
import {Filter} from "@labkey/api";

const SAMPLES_IMPORT_PIPELINE_PROVIDER = 'Samples Import';
const SOURCES_IMPORT_PIPELINE_PROVIDER = 'Sources Import';

export const PROVIDERS = [SAMPLES_IMPORT_PIPELINE_PROVIDER, SOURCES_IMPORT_PIPELINE_PROVIDER, "General"];
export const PIPELINE_PROVIDER_FILTER = Filter.create('Provider', PROVIDERS, Filter.Types.IN);

export const ACTIVE_JOB_INDICATOR_CLS = 'fa-spinner fa-pulse';

export const DATA_IMPORT_FILE_SIZE_LIMITS = Map<string, any>({
    "all": {
        maxPreviewSize: {
            value: 5242880,
            displayValue: "5MB"
        }
    }
});

export const BACKGROUND_IMPORT_MIN_FILE_SIZE = 1024*100; //100kb
export const BACKGROUND_IMPORT_MIN_ROW_SIZE = 1000;
