import React, { FC, memo } from 'react';

import { getSampleStatusType, isSampleOperationPermitted } from '../internal/components/samples/utils';
import { SampleOperation } from '../internal/components/samples/constants';

import { onSampleChange } from './actions';
import { SampleAliquotsGridPanel } from './SampleAliquotsGridPanel';
import { SampleDetailContextConsumer, SampleDetailPage, SampleDetailPageProps } from './SampleDetailPage';
import { useSampleTypeAppContext } from './SampleTypeAppContext';

interface Props extends SampleDetailPageProps {
    omittedColumns?: string[];
}

export const SampleAliquotsPage: FC<Props> = memo(props => {
    const { omittedColumns, ...sampleDetailPageProps } = props;
    const { assayProviderType } = useSampleTypeAppContext();

    return (
        <SampleDetailPage title="Aliquots" {...sampleDetailPageProps}>
            <SampleDetailContextConsumer>
                {({ sampleId, sampleModel, rootLsid, sampleLsid, user }) => {
                    return (
                        <SampleAliquotsGridPanel
                            lineageUpdateAllowed={isSampleOperationPermitted(
                                getSampleStatusType(sampleModel.getRow()),
                                SampleOperation.EditLineage
                            )}
                            sampleId={sampleId}
                            sampleLsid={sampleLsid}
                            rootLsid={rootLsid}
                            schemaQuery={sampleModel.schemaQuery}
                            user={user}
                            onSampleChangeInvalidate={onSampleChange}
                            assayProviderType={assayProviderType}
                            omittedColumns={omittedColumns}
                        />
                    );
                }}
            </SampleDetailContextConsumer>
        </SampleDetailPage>
    );
});
