import React, { FC, memo, useCallback, useMemo } from 'react';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { getURLParamsForSampleSelectionKey } from '../samples/utils';
import { AppURL } from '../../url/AppURL';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';
import { ASSAYS_KEY } from '../../app/constants';
import { User } from '../base/models/User';
import { incrementClientSideMetricCount } from '../../actions';
import { userCanReadAssays } from '../../app/utils';
import { ResponsiveMenuButton } from '../buttons/ResponsiveMenuButton';

import { MAX_SELECTION_ACTION_ROWS } from '../../constants';

import { SampleTypeDataType } from './constants';

function getAssayResultsHref(
    model: QueryModel,
    picklistName?: string,
    isAssay?: boolean,
    sampleFieldKey?: string
): AppURL {
    const params = getURLParamsForSampleSelectionKey(model, picklistName, isAssay, sampleFieldKey);
    return AppURL.create(ASSAYS_KEY, 'sampleresults').addParams(params);
}

interface Props {
    asSubMenu?: boolean;
    isAssay?: boolean;
    isPicklist?: boolean;
    metricFeatureArea?: string;
    model: QueryModel;
    user: User;
}

export const AssayResultsForSamplesMenuItem: FC<Props> = memo(props => {
    const { model, metricFeatureArea, isAssay, isPicklist, user } = props;
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
            text="View Assay Results for Selected"
            href={getAssayResultsHref(model, picklistName, isAssay, sampleFieldKey)}
            onClick={incrementMetric}
            queryModel={model}
            maxSelection={MAX_SELECTION_ACTION_ROWS}
            nounPlural={SampleTypeDataType.nounPlural}
        />
    );
});
AssayResultsForSamplesMenuItem.displayName = 'AssayResultsForSamplesMenuItem';

export const AssayResultsForSamplesButton: FC<Props> = memo(props => {
    const { asSubMenu, user } = props;
    if (!userCanReadAssays(user)) return null;

    return (
        <ResponsiveMenuButton className="sample-reports-menu" text="Reports" asSubMenu={asSubMenu}>
            <AssayResultsForSamplesMenuItem {...props} />
        </ResponsiveMenuButton>
    );
});
AssayResultsForSamplesButton.displayName = 'AssayResultsForSamplesButton';
