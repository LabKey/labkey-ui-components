import React, { FC, memo, useMemo } from 'react';
import { Filter } from '@labkey/api';

import { SAMPLES_KEY } from '../internal/app/constants';

import { QueryConfig, QueryModel } from '../public/QueryModel/QueryModel';
import { SchemaQuery } from '../public/SchemaQuery';
import { AppURL } from '../internal/url/AppURL';

import { caseInsensitive } from '../internal/util/utils';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';

import { InjectedQueryModels, withQueryModels } from '../public/QueryModel/withQueryModels';

import { ALIQUOT_FILTER_MODE } from '../internal/components/samples/constants';

import { SampleAliquotsStats } from '../internal/components/samples/models';
import { getSampleAliquotsQueryConfig, getSampleAliquotsStats } from '../internal/components/samples/actions';

import { isAssayEnabled } from '../internal/app/utils';
import { useServerContext } from '../internal/components/base/ServerContext';

import { SampleAliquotAssaysCount } from './SampleAliquotAssaysCount';

interface OwnProps {
    sampleId: string;
    sampleLsid: string;
    sampleRow: any;
    sampleSchemaQuery?: SchemaQuery;
    sampleSet: string;
}

export interface SampleAliquotsSummaryWithModelsProps extends OwnProps {
    aliquotsModel: QueryModel;
    jobsModel?: QueryModel;
}

// exported for jest testing
export const SampleAliquotsSummaryWithModels: FC<SampleAliquotsSummaryWithModelsProps> = memo(props => {
    const { aliquotsModel, jobsModel, sampleSchemaQuery, sampleSet, sampleId, sampleRow } = props;
    const { moduleContext } = useServerContext();

    let stats: SampleAliquotsStats;
    if (aliquotsModel.rowCount > 0) {
        stats = getSampleAliquotsStats(aliquotsModel.rows);
        if (jobsModel) {
            stats.jobsCount = jobsModel.rowCount;
        }
    }

    const aliquotUrl = AppURL.create(SAMPLES_KEY, sampleSet, sampleId, 'Aliquots');
    const jobUrl = AppURL.create(SAMPLES_KEY, sampleSet, sampleId, 'Jobs')
        .addParam('sampleAliquotType', ALIQUOT_FILTER_MODE.aliquots)
        .toHref();
    const assayDataUrl = AppURL.create(SAMPLES_KEY, sampleSet, sampleId, 'Assays')
        .addParam('sampleAliquotType', ALIQUOT_FILTER_MODE.aliquots)
        .toHref();

    const totalAliquotVolume = caseInsensitive(sampleRow, 'AliquotVolume')?.value?.toLocaleString();
    const units = caseInsensitive(sampleRow, 'Units')?.displayValue ?? caseInsensitive(sampleRow, 'Units')?.value;
    const totalAliquotVolumeDisplay =
        totalAliquotVolume != null ? totalAliquotVolume + (units ? ' ' + units : '') : undefined;

    return (
        <>
            {!stats && <span className="sample-aliquots-stats-empty">This sample has no aliquots.</span>}
            {!!stats && (
                <table className="table table-responsive table-condensed detail-component--table__fixed sample-aliquots-stats-table">
                    <tbody>
                        <tr>
                            <td>Total Aliquots Created</td>
                            <td className="aliquot-stats-value">
                                <a href={aliquotUrl.toHref()}>{stats.aliquotCount}</a>
                            </td>
                        </tr>
                        <tr>
                            <td>Available Aliquots</td>
                            <td className="aliquot-stats-value">
                                <a href={aliquotUrl.addFilters(Filter.create('StoredAmount', 0, Filter.Types.GT)).toHref()}>
                                    {stats.availableCount + '/' + stats.aliquotCount}
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td>Current Available Amount</td>
                            <td className="aliquot-stats-value">
                                {totalAliquotVolumeDisplay ? totalAliquotVolumeDisplay : 'Not available'}
                            </td>
                        </tr>
                        <tr>
                            <td>Jobs with Aliquots</td>
                            <td className="aliquot-stats-value">
                                <a href={jobUrl}>{stats.jobsCount}</a>
                            </td>
                        </tr>
                        {isAssayEnabled(moduleContext) && (
                            <tr>
                                <td>Assay Data with Aliquots</td>
                                <td className="aliquot-stats-value">
                                    <a href={assayDataUrl}>
                                        <SampleAliquotAssaysCount
                                            aliquotIds={stats.aliquotIds}
                                            sampleSchemaQuery={sampleSchemaQuery}
                                            sampleId={sampleId}
                                        />
                                    </a>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </>
    );
});

interface PanelProps {
    aliquotsModelId: string;
    jobsModelId: string;
}

const SampleAliquotsSummaryPanel: FC<OwnProps & PanelProps & InjectedQueryModels> = memo(props => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { actions, aliquotsModelId, jobsModelId, queryModels, ...ownProps } = props;
    const aliquotsModel = queryModels[aliquotsModelId];
    const jobsModel = queryModels[jobsModelId];
    const isLoading = aliquotsModel.isLoadingTotalCount || !jobsModel || jobsModel.isLoadingTotalCount;

    return (
        <div className="panel panel-default">
            <div className="panel-heading">Aliquots</div>
            <div className="panel-body">
                {isLoading && <LoadingSpinner />}
                {!isLoading && (
                    <SampleAliquotsSummaryWithModels
                        {...ownProps}
                        aliquotsModel={aliquotsModel}
                        jobsModel={jobsModel}
                    />
                )}
            </div>
        </div>
    );
});

const SampleAliquotsSummaryWithModelsBase = withQueryModels<OwnProps & PanelProps>(SampleAliquotsSummaryPanel);

interface SampleAliquotsSummaryProps extends OwnProps {
    aliquotJobsQueryConfig?: QueryConfig;
}

export const SampleAliquotsSummary: FC<SampleAliquotsSummaryProps> = memo(props => {
    const { aliquotJobsQueryConfig, ...ownProps } = props;
    const { sampleId, sampleSet, sampleLsid } = ownProps;
    const aliquotsQueryConfig = useMemo(
        () => getSampleAliquotsQueryConfig(sampleSet, sampleLsid, false),
        [sampleLsid, sampleSet]
    );
    const queryConfigs = { [aliquotsQueryConfig.id]: aliquotsQueryConfig };
    if (aliquotJobsQueryConfig) {
        queryConfigs[aliquotJobsQueryConfig.id] = aliquotJobsQueryConfig;
    }

    return (
        <SampleAliquotsSummaryWithModelsBase
            {...ownProps}
            aliquotsModelId={aliquotsQueryConfig.id}
            autoLoad
            jobsModelId={aliquotJobsQueryConfig?.id}
            key={sampleId}
            queryConfigs={queryConfigs}
        />
    );
});
