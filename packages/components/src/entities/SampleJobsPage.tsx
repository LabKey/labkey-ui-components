import React, { FC, memo } from 'react';

import { ProductMenuModel } from '../internal/components/navigation/model';
import { AppURL } from '../internal/url/AppURL';

import { ALIQUOT_FILTER_MODE, SampleOperation } from '../internal/components/samples/constants';
import { getSampleStatusType, isSampleOperationPermitted } from '../internal/components/samples/utils';

import { SampleDetailContextConsumer, SampleDetailPage } from './SampleDetailPage';
import { useSampleTypeAppContext } from './SampleTypeAppContext';

interface Props {
    location?: any;
    menu: ProductMenuModel;
    navigate: (url: string | AppURL, replace?: boolean) => void;
    params?: any;
}

export const SampleJobsPage: FC<Props> = memo(props => {
    const { WorkflowGridComponent } = useSampleTypeAppContext();

    return (
        <SampleDetailPage {...props} title="Sample Jobs">
            <SampleDetailContextConsumer>
                {({ sampleId, sampleLsid, sampleModel, sampleContainer, isAliquot, location, user }) => {
                    // if sample is aliquot, include jobs that contain the exact aliquot only, without rollup
                    const sampleAliquotType = isAliquot
                        ? ALIQUOT_FILTER_MODE.samples
                        : location?.query?.sampleAliquotType;

                    return (
                        <WorkflowGridComponent
                            containerPath={sampleContainer.path}
                            gridPrefix={'sample-jobs-' + sampleId}
                            visibleTabs={['all']} // i.e. ALL_JOBS_QUEUE_KEY
                            sampleId={sampleId}
                            sampleLSID={sampleLsid}
                            sampleAliquotType={sampleAliquotType}
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
