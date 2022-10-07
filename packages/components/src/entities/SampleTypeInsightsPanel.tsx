import React, { FC, memo } from 'react';
import { Panel } from 'react-bootstrap';
import { Filter } from '@labkey/api';

import { createPercentageBarData, createHorizontalBarLegendData } from '../internal/components/chart/utils';
import { HorizontalBarData, HorizontalBarSection } from '../internal/components/chart/HorizontalBarSection';
import { ItemsLegend } from '../internal/components/chart/ItemsLegend';
import { SAMPLES_KEY } from '../internal/app/constants';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { isLoading } from '../public/LoadingState';
import { QuerySort } from '../public/QuerySort';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';
import { AppURL } from '../internal/url/AppURL';
import { LabelHelpTip } from '../internal/components/base/LabelHelpTip';
import { SCHEMAS } from '../internal/schemas';
import { caseInsensitive } from '../internal/util/utils';

import { InjectedQueryModels, withQueryModels } from '../public/QueryModel/withQueryModels';

export const INSIGHTS_MODEL_ID = 'sample-type-insights';
export const STATUS_COUNTS_MODEL_ID = 'sample-type-status-counts';

interface OwnProps {
    sampleSet: string;
}

type Props = OwnProps & InjectedQueryModels;

// exported for jest testing
export const SampleTypeInsightsPanelImpl: FC<Props> = memo(props => {
    const { queryModels, sampleSet } = props;
    const insightsModel = queryModels[INSIGHTS_MODEL_ID];
    const statusModel = queryModels[STATUS_COUNTS_MODEL_ID];

    if (isLoading(insightsModel.rowsLoadingState) || isLoading(statusModel.rowsLoadingState)) {
        return (
            <Panel>
                <Panel.Heading>Insights</Panel.Heading>
                <Panel.Body>
                    <LoadingSpinner />
                </Panel.Body>
            </Panel>
        );
    }

    const storageData = createPercentageBarData(
        insightsModel.getRow(),
        'Samples',
        undefined,
        'TotalCount',
        [
            {
                queryKey: 'CheckedOutCount',
                name: 'CheckedOut',
                label: 'Checked out',
                className: 'bar-insights--checkedout',
            },
            {
                queryKey: 'InStorageCount',
                name: 'InStorage',
                label: 'In storage',
                className: 'bar-insights--instorage',
                useForSubtitle: true,
            },
            {
                queryKey: 'NotInStorageCount',
                name: 'NotInStorage',
                label: 'Not in storage',
                className: 'bar-insights--notinstorage',
                filled: false,
            },
        ],
        AppURL.create(SAMPLES_KEY, sampleSet),
        'StorageStatus'
    );
    const aliquotData = createPercentageBarData(insightsModel.getRow(), 'Samples', undefined, 'TotalCount', [
        {
            queryKey: 'AliquotCount',
            name: 'Aliquots',
            label: 'aliquots',
            className: 'bar-insights--aliquots',
            useForSubtitle: true,
            appURL: AppURL.create(SAMPLES_KEY, sampleSet).addFilters(Filter.create('IsAliquot', true)),
        },
        {
            queryKey: 'NonAliquotCount',
            name: 'NonAliquots',
            label: 'not aliquots',
            className: 'bar-insights--nonaliquots',
            filled: false,
            appURL: AppURL.create(SAMPLES_KEY, sampleSet).addFilters(Filter.create('IsAliquot', false)),
        },
    ]);
    const statusBarData = getSampleStatusBarData(statusModel);
    const statusLegendData = createHorizontalBarLegendData(statusBarData);
    const statusData = {
        data: statusBarData,
        subtitle: statusBarData?.length > 0 && (
            <div className="storage-item-legend">
                <LabelHelpTip
                    iconComponent={
                        <span>
                            <i className="fa fa-info-circle" /> Legend
                        </span>
                    }
                    placement="bottom"
                    title="Sample Status Legend"
                >
                    <ItemsLegend legendData={statusLegendData} />
                </LabelHelpTip>
            </div>
        ),
    };

    return (
        <Panel>
            <Panel.Heading>Insights</Panel.Heading>
            <Panel.Body>
                <HorizontalBarSection
                    title="Storage Status"
                    subtitle={storageData?.subtitle}
                    data={storageData?.data}
                />
                <HorizontalBarSection title="Sample Status" subtitle={statusData?.subtitle} data={statusData?.data} />
                <HorizontalBarSection title="Aliquots" subtitle={aliquotData?.subtitle} data={aliquotData?.data} />
            </Panel.Body>
        </Panel>
    );
});

const SampleTypeInsightsPanelWithQueryModels = withQueryModels<OwnProps>(SampleTypeInsightsPanelImpl);

export const SampleTypeInsightsPanel: FC<OwnProps> = memo(props => {
    const queryConfigs = {
        [INSIGHTS_MODEL_ID]: {
            id: INSIGHTS_MODEL_ID,
            schemaQuery: SCHEMAS.SAMPLE_MANAGEMENT.SAMPLE_TYPE_INSIGHTS,
            baseFilters: [Filter.create('SampleSet/Name', props.sampleSet)],
        },
        [STATUS_COUNTS_MODEL_ID]: {
            id: STATUS_COUNTS_MODEL_ID,
            schemaQuery: SCHEMAS.SAMPLE_MANAGEMENT.SAMPLE_STATUS_COUNTS,
            baseFilters: [Filter.create('Name', props.sampleSet)],
            sorts: [new QuerySort({ fieldKey: 'ClassName' }), new QuerySort({ fieldKey: 'Status' })],
        },
    };
    return <SampleTypeInsightsPanelWithQueryModels {...props} autoLoad queryConfigs={queryConfigs} />;
});

const getSampleStatusBarData = (model: QueryModel): HorizontalBarData[] => {
    let data = [];
    let totalSamples = 0;

    model.gridData.forEach(row => {
        const sampleType = caseInsensitive(row, 'Name').value;
        const status = caseInsensitive(row, 'Status').value;
        const count = caseInsensitive(row, 'TotalCount').value;
        const hasStatus = status !== 'No Status';
        totalSamples += count;

        data.push({
            name: status,
            title: count.toLocaleString() + " '" + status + "' " + (count === 1 ? 'sample' : 'samples'),
            count,
            backgroundColor: hasStatus && caseInsensitive(row, 'Color').value,
            className: caseInsensitive(row, 'ClassName').value,
            href: getAppURLWithFilter(sampleType, 'SampleState/Label', hasStatus ? status : undefined).toHref(),
            filled: hasStatus,
        });
    });

    data = data.map(row => {
        return { ...row, totalCount: totalSamples, percent: (row.count / totalSamples) * 100 };
    });

    return data;
};

const getAppURLWithFilter = (sampleType: string, filterKey: string, value: any): AppURL => {
    let url = AppURL.create(SAMPLES_KEY, sampleType);
    if (value !== undefined && value !== null) {
        url = url.addFilters(Filter.create(filterKey, value));
    } else {
        url = url.addFilters(Filter.create(filterKey, null, Filter.Types.ISBLANK));
    }
    return url;
};
