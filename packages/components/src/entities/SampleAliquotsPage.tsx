import React, { FC, memo } from 'react';

import { getSampleStatusType, isSampleOperationPermitted } from '../internal/components/samples/utils';
import { SampleOperation } from '../internal/components/samples/constants';

import { InjectedRouteLeaveProps, withRouteLeave } from '../internal/util/RouteLeave';

import { onSampleChange } from './actions';
import { SampleAliquotsGridPanel } from './SampleAliquotsGridPanel';
import { SampleDetailContextConsumer, SampleDetailPage, SampleDetailPageProps } from './SampleDetailPage';
import { useSampleTypeAppContext } from './useSampleTypeAppContext';

interface OwnProps {
    omittedColumns?: string[];
}

export type Props = OwnProps & SampleDetailPageProps & InjectedRouteLeaveProps;

const SampleAliquotsPageImpl: FC<Props> = memo(props => {
    const { omittedColumns, setIsDirty, getIsDirty, ...sampleDetailPageProps } = props;
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
                            setIsDirty={setIsDirty}
                            getIsDirty={getIsDirty}
                        />
                    );
                }}
            </SampleDetailContextConsumer>
        </SampleDetailPage>
    );
});

export const SampleAliquotsPage = withRouteLeave(SampleAliquotsPageImpl);
