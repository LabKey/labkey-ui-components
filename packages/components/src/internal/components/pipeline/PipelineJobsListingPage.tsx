import React, { FC } from 'react';

import { biologicsIsPrimaryApp, sampleManagerIsPrimaryApp } from '../../app/utils';

import { PipelineJobsPage } from './PipelineJobsPage';
import { PIPELINE_PROVIDER_FILTER_LKB, PIPELINE_PROVIDER_FILTER_LKSM } from './constants';

// TODO: this component is not necessary, we can just use PipelineJobsPage directly.
export const PipelineJobsListingPage: FC = () => {
    let baseFilters;
    if (sampleManagerIsPrimaryApp()) baseFilters = [PIPELINE_PROVIDER_FILTER_LKSM];
    else if (biologicsIsPrimaryApp()) baseFilters = [PIPELINE_PROVIDER_FILTER_LKB];

    return <PipelineJobsPage autoRefresh={true} title="Background Imports" baseFilters={baseFilters} />;
};
