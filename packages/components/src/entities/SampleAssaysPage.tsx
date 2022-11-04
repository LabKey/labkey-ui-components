import React, { FC, memo } from 'react';

import { userCanReadAssays } from '../internal/app/utils';
import { InsufficientPermissionsAlert } from '../internal/components/permissions/InsufficientPermissionsAlert';
import { ALIQUOT_FILTER_MODE } from '../internal/components/samples/constants';

import { SampleAssayDetail } from './SampleAssayDetail';
import { SampleDetailContextConsumer, SampleDetailPage, SampleDetailPageProps } from './SampleDetailPage';

export const SampleAssaysPage: FC<SampleDetailPageProps> = memo(props => {
    return (
        <SampleDetailPage title="Sample Assay Results" {...props}>
            <SampleDetailContextConsumer>
                {({ sampleId, sampleModel, sampleName, isAliquot, sampleAliquotType, user }) => {
                    if (!userCanReadAssays(user)) {
                        return <InsufficientPermissionsAlert />;
                    }

                    return (
                        <SampleAssayDetail
                            sampleId={sampleId}
                            sampleModel={sampleModel}
                            showAliquotViewSelector={!isAliquot}
                            sampleAliquotType={sampleAliquotType ?? ALIQUOT_FILTER_MODE.all}
                            user={user}
                            exportPrefix={sampleName}
                        />
                    );
                }}
            </SampleDetailContextConsumer>
        </SampleDetailPage>
    );
});
