import React, { FC, memo } from 'react';

import { userCanReadAssays } from '../internal/app/utils';
import { InsufficientPermissionsAlert } from '../internal/components/permissions/InsufficientPermissionsAlert';
import { ALIQUOT_FILTER_MODE } from '../internal/components/samples/constants';
import { ProductMenuModel } from '../internal/components/navigation/model';
import { AppURL } from '../internal/url/AppURL';
import { EntityDataType } from '../internal/components/entities/models';

import { SampleAssayDetail } from './SampleAssayDetail';
import { SampleDetailContextConsumer, SampleDetailPage } from './SampleDetailPage';

interface Props {
    entityDataType?: EntityDataType;
    location?: any;
    menu: ProductMenuModel;
    navigate: (url: string | AppURL, replace?: boolean) => void;
    noun?: string;
    params?: any;
    requiredColumns?: string[];
    sampleType?: string;
    title?: string;
}

export const SampleAssaysPage: FC<Props> = memo(props => {
    const { title, ...rest } = props;
    const title_ = title ?? 'Sample Assay Results';

    return (
        <SampleDetailPage {...rest} title={title_}>
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
    );
});
