import React, { FC, memo } from 'react';

import { ProductMenuModel } from '../internal/components/navigation/model';
import { AppURL } from '../internal/url/AppURL';

import { getSampleStatusType, isSampleOperationPermitted } from '../internal/components/samples/utils';
import { SampleOperation } from '../internal/components/samples/constants';
import { SchemaQuery } from '../public/SchemaQuery';
import { SCHEMAS } from '../internal/schemas';

import { GENERAL_ASSAY_PROVIDER_NAME } from '../internal/components/assay/actions';

import { onSampleChange } from './actions';
import { SampleAliquotsGridPanel } from './SampleAliquotsGridPanel';
import { SampleDetailContextConsumer, SampleDetailPage } from './SampleDetailPage';

interface Props {
    location?: any;
    menu: ProductMenuModel;
    navigate: (url: string | AppURL, replace?: boolean) => void;
    params?: any;
}

export const SampleAliquotsPage: FC<Props> = memo(props => (
    <SampleDetailPage {...props} title="Aliquots">
        <SampleDetailContextConsumer>
            {({ sampleId, sampleModel, rootLsid, sampleType, sampleLsid, user }) => {
                return (
                    <SampleAliquotsGridPanel
                        lineageUpdateAllowed={isSampleOperationPermitted(
                            getSampleStatusType(sampleModel.getRow()),
                            SampleOperation.EditLineage
                        )}
                        sampleId={sampleId}
                        sampleLsid={sampleLsid}
                        rootLsid={rootLsid}
                        schemaQuery={SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType)}
                        user={user}
                        onSampleChangeInvalidate={onSampleChange}
                        assayProviderType={GENERAL_ASSAY_PROVIDER_NAME}
                    />
                );
            }}
        </SampleDetailContextConsumer>
    </SampleDetailPage>
));
