import React, { FC, memo } from 'react';

import { userCanReadAssays } from '../internal/app/utils';
import { InsufficientPermissionsAlert } from '../internal/components/permissions/InsufficientPermissionsAlert';

import { ALIQUOT_FILTER_MODE } from '../internal/components/samples/constants';

import { ProductMenuModel } from '../internal/components/navigation/model';

import { AppURL } from '../internal/url/AppURL';

import { SampleAssayDetail } from './SampleAssayDetail';
import { SampleDetailContextConsumer, SampleDetailPage } from './SampleDetailPage';

interface Props {
    location?: any;
    menu: ProductMenuModel;
    navigate: (url: string | AppURL, replace?: boolean) => void;
    params?: any;
}

export const SampleAssaysPage: FC<Props> = memo(props => (
    <SampleDetailPage {...props} title="Sample Assay Results">
        <SampleDetailContextConsumer>
            {({ sampleId, sampleModel, sampleName, isAliquot, location, user }) => {
                if (!userCanReadAssays(user)) {
                    return <InsufficientPermissionsAlert />;
                }

                return (
                    <SampleAssayDetail
                        sampleId={sampleId}
                        sampleModel={sampleModel}
                        showAliquotViewSelector={!isAliquot}
                        sampleAliquotType={location?.query?.sampleAliquotType ?? ALIQUOT_FILTER_MODE.all}
                        user={user}
                        exportPrefix={sampleName}
                    />
                );
            }}
        </SampleDetailContextConsumer>
    </SampleDetailPage>
));
