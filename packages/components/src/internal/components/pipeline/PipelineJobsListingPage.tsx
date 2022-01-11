import React, { FC } from 'react';

import { PipelineJobsPage } from './PipelineJobsPage';
import { PIPELINE_PROVIDER_FILTER_LKB, PIPELINE_PROVIDER_FILTER_LKSM} from './constants';
import {biologicsIsPrimaryApp, sampleManagerIsPrimaryApp} from "../../app/utils";

interface Props {
    params: any;
}

export const PipelineJobsListingPage: FC<Props> = props => {
    const baseFilters = sampleManagerIsPrimaryApp() ? [PIPELINE_PROVIDER_FILTER_LKSM] : biologicsIsPrimaryApp ? [PIPELINE_PROVIDER_FILTER_LKB] : null;

    return (
        <PipelineJobsPage
            {...props}
            autoRefresh={true}
            title="Background Imports"
            baseFilters={baseFilters}
        />
    );
};
