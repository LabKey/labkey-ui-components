import React, { FC, memo } from 'react';

import { ALIQUOT_FILTER_MODE, SampleOperation } from '../internal/components/samples/constants';
import { getSampleStatusType, isSampleOperationPermitted } from '../internal/components/samples/utils';

import { SampleDetailContextConsumer, SampleDetailPage, SampleDetailPageProps } from './SampleDetailPage';
import { useSampleTypeAppContext } from './useSampleTypeAppContext';

export const SampleJobsPage: FC<SampleDetailPageProps> = memo(props => {
    const { WorkflowGridComponent } = useSampleTypeAppContext();

    return (
        <SampleDetailPage title="Sample Jobs" {...props}>
            <SampleDetailContextConsumer>
                {({ sampleId, sampleLsid, sampleModel, sampleContainer, isAliquot, sampleAliquotType, user }) => {
                    return (
                        <WorkflowGridComponent
                            containerPath={sampleContainer.path}
                            gridPrefix={'sample-jobs-' + sampleId}
                            visibleTabs={['all']} // i.e. ALL_JOBS_QUEUE_KEY
                            sampleId={sampleId}
                            sampleLSID={sampleLsid}
                            // if sample is aliquot, include jobs that contain the exact aliquot only, without rollup
                            sampleAliquotType={isAliquot ? ALIQUOT_FILTER_MODE.samples : sampleAliquotType}
                            showAliquotViewSelector={!isAliquot}
                            showTemplateTabs
                            showStartButton={isSampleOperationPermitted(
                                getSampleStatusType(sampleModel.getRow()),
                                SampleOperation.AddToWorkflow
                            )}
                            user={user}
                        />
                    );
                }}
            </SampleDetailContextConsumer>
        </SampleDetailPage>
    );
});
