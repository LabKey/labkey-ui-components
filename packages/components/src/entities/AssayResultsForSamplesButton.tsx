import React, { FC, memo, useCallback, useMemo } from 'react';

import { QueryModel } from '../public/QueryModel/QueryModel';
import { ResponsiveMenuButton } from '../internal/components/buttons/ResponsiveMenuButton';
import { SelectionMenuItem } from '../internal/components/menus/SelectionMenuItem';
import { SampleTypeDataType } from '../internal/components/entities/constants';
import { getURLParamsForSampleSelectionKey } from '../internal/components/samples/utils';
import { AppURL, createProductUrlFromParts } from '../internal/url/AppURL';
import { ASSAYS_KEY } from '../internal/app/constants';
import { incrementClientSideMetricCount } from '../internal/actions';
import { userCanReadAssays } from '../internal/app/utils';
import { User } from '../internal/components/base/models/User';

function getAssayResultsHref(
    model: QueryModel,
    picklistName?: string,
    isAssay?: boolean,
    sampleFieldKey?: string,
    currentProductId?: string,
    targetProductId?: string
): string {
    const params = getURLParamsForSampleSelectionKey(model, picklistName, isAssay, sampleFieldKey);
    const actionUrl = createProductUrlFromParts(targetProductId, currentProductId, params, ASSAYS_KEY, 'sampleresults');
    return actionUrl instanceof AppURL ? actionUrl.toHref() : actionUrl;
}

interface Props {
    asSubMenu?: boolean;
    currentProductId?: string;
    isAssay?: boolean;
    isPicklist?: boolean;
    metricFeatureArea?: string;
    model: QueryModel;
    targetProductId?: string;
    user: User;
}

export const AssayResultsForSamplesMenuItem: FC<Props> = memo(props => {
    const { model, metricFeatureArea, isAssay, isPicklist, currentProductId, targetProductId, user } = props;
    const picklistName = useMemo(() => (isPicklist ? model.queryName : undefined), [model, isPicklist]);
    const sampleFieldKey = useMemo(
        () => (isAssay ? model.displayColumns?.find(c => c.isSampleLookup())?.fieldKey : undefined),
        [model, isAssay]
    );

    const incrementMetric = useCallback(() => {
        incrementClientSideMetricCount(metricFeatureArea, 'viewAssayResultsForSamples');
    }, [metricFeatureArea]);

    if (!userCanReadAssays(user)) return null;

    return (
        <SelectionMenuItem
            id="assay-sample-results-menu-item"
            text="View Assay Results for Selected"
            href={getAssayResultsHref(model, picklistName, isAssay, sampleFieldKey, currentProductId, targetProductId)}
            onClick={incrementMetric}
            queryModel={model}
            nounPlural={SampleTypeDataType.nounPlural}
        />
    );
});

export const AssayResultsForSamplesButton: FC<Props> = memo(props => {
    const { asSubMenu, user } = props;
    if (!userCanReadAssays(user)) return null;

    const items = <AssayResultsForSamplesMenuItem {...props} />;
    return <ResponsiveMenuButton id="sample-reports-menu" items={items} text="Reports" asSubMenu={asSubMenu} />;
});
