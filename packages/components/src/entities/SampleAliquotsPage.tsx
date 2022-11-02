import React, { FC, memo } from 'react';

import { ProductMenuModel } from '../internal/components/navigation/model';
import { AppURL } from '../internal/url/AppURL';
import { getSampleStatusType, isSampleOperationPermitted } from '../internal/components/samples/utils';
import { SampleOperation } from '../internal/components/samples/constants';
import { EntityDataType } from '../internal/components/entities/models';

import { onSampleChange } from './actions';
import { SampleAliquotsGridPanel } from './SampleAliquotsGridPanel';
import { SampleDetailContextConsumer, SampleDetailPage } from './SampleDetailPage';
import { useSampleTypeAppContext } from './SampleTypeAppContext';

interface Props {
    entityDataType?: EntityDataType;
    iconSrc?: string;
    location?: any;
    menu: ProductMenuModel;
    navigate: (url: string | AppURL, replace?: boolean) => void;
    noun?: string;
    omittedColumns?: string[];
    params?: any;
    requiredColumns?: string[];
    sampleType?: string;
    title?: string;
}

export const SampleAliquotsPage: FC<Props> = memo(props => {
    const { omittedColumns, title, ...rest } = props;
    const title_ = title ?? 'Aliquots';
    const { assayProviderType } = useSampleTypeAppContext();

    return (
        <SampleDetailPage {...rest} title={title_}>
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
