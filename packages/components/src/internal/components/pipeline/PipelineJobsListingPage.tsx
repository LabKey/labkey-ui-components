import React, { FC } from 'react';

import { PipelineJobsPage } from './PipelineJobsPage';
import { PIPELINE_PROVIDER_FILTER } from './constants';

interface Props {
    params: any;
}

export const PipelineJobsListingPage: FC<Props> = props => {
    return (
        <PipelineJobsPage
            {...props}
            autoRefresh={true}
            title="Background Imports"
            baseFilters={[PIPELINE_PROVIDER_FILTER]}
        />
    );
};
