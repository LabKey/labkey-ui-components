import React, { FC, memo } from 'react';

import { ProductMenuModel } from '../internal/components/navigation/model';
import { AppURL } from '../internal/url/AppURL';

import { getSampleStatusType, isSampleOperationPermitted } from '../internal/components/samples/utils';
import { SampleOperation } from '../internal/components/samples/constants';

import { onSampleChange } from './actions';
import { SampleAliquotsGridPanel } from './SampleAliquotsGridPanel';
import { SampleDetailContextConsumer, SampleDetailPage } from './SampleDetailPage';
import { useSampleTypeAppContext } from './SampleTypeAppContext';

interface Props {
    location?: any;
    menu: ProductMenuModel;
    navigate: (url: string | AppURL, replace?: boolean) => void;
    omittedColumns?: string[];
    params?: any;
}

export const SampleAliquotsPage: FC<Props> = memo(props => {
    const { omittedColumns, ...rest } = props;
    const { assayProviderType } = useSampleTypeAppContext();

    return (
        <SampleDetailPage {...rest} title="Aliquots">
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
