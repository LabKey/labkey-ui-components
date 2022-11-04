import React, { PureComponent } from 'react';
import { Panel } from 'react-bootstrap';
import { Filter } from '@labkey/api';

import { SAMPLES_KEY } from '../internal/app/constants';

import { QueryConfig, QueryModel } from '../public/QueryModel/QueryModel';
import { SchemaQuery } from '../public/SchemaQuery';
import { AppURL } from '../internal/url/AppURL';

import { caseInsensitive } from '../internal/util/utils';
import { isLoading } from '../public/LoadingState';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';

import { InjectedQueryModels, withQueryModels } from '../public/QueryModel/withQueryModels';

import { ALIQUOT_FILTER_MODE } from '../internal/components/samples/constants';
import { SampleAliquotAssaysCount } from './SampleAliquotAssaysCount';
import { SampleAliquotsStats } from '../internal/components/samples/models';
import { getSampleAliquotsQueryConfig, getSampleAliquotsStats } from '../internal/components/samples/actions';

interface OwnProps {
    aliquotJobsQueryConfig: QueryConfig;
    sampleId: string;
    sampleLsid: string;
    sampleRow: any;
    sampleSchemaQuery?: SchemaQuery;
    sampleSet: string;
}

type Props = OwnProps & InjectedQueryModels;

interface SampleAliquotsSummaryWithModelsProps {
    aliquotsModel: QueryModel;
    hideAssayData?: boolean;
    jobsModel?: QueryModel;
}

// exported for jest testing
export class SampleAliquotsSummaryWithModels extends PureComponent<Props & SampleAliquotsSummaryWithModelsProps> {
    renderStats(stats: SampleAliquotsStats, hideAssayData?: boolean) {
        const { sampleSet, sampleId, sampleRow, sampleSchemaQuery } = this.props;
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
                <tr>
                    <td>Total aliquots created:</td>
                    <td className="aliquot-stats-value">
                        <a href={aliquotUrl.toHref()}>{stats.aliquotCount}</a>
                    </td>
                </tr>
                <tr>
                    <td>Available aliquots:</td>
                    <td className="aliquot-stats-value">
                        <a href={aliquotUrl.addFilters(Filter.create('StorageStatus', 'In storage')).toHref()}>
                            {stats.inStorageCount + '/' + stats.aliquotCount}
                        </a>
                    </td>
                </tr>
                <tr>
                    <td>Current available amount:</td>
                    <td className="aliquot-stats-value">
                        {totalAliquotVolumeDisplay ? totalAliquotVolumeDisplay : 'Not available'}
                    </td>
                </tr>
                <tr>
                    <td>Jobs with aliquots:</td>
                    <td className="aliquot-stats-value">
                        <a href={jobUrl}>{stats.jobsCount}</a>
                    </td>
                </tr>
                {!hideAssayData && (
                    <tr>
                        <td>Assay data with aliquots:</td>
                        <td className="aliquot-stats-value">
                            <a href={assayDataUrl}>
                                <SampleAliquotAssaysCount
                                    sampleId={sampleId}
                                    aliquotIds={stats.aliquotIds}
                                    sampleSchemaQuery={sampleSchemaQuery}
                                />
                            </a>
                        </td>
                    </tr>
                )}
            </>
        );
    }

    render() {
        const { aliquotsModel, jobsModel, hideAssayData } = this.props;

        if (
            !aliquotsModel ||
            isLoading(aliquotsModel.rowsLoadingState) ||
            !jobsModel ||
            isLoading(jobsModel.rowsLoadingState)
        ) {
            return <LoadingSpinner />;
        }

        const stats: SampleAliquotsStats =
            aliquotsModel.rowCount === 0 ? null : getSampleAliquotsStats(aliquotsModel.rows);
        if (stats) stats.jobsCount = jobsModel.rowCount;

        return (
            <Panel>
                <Panel.Heading>Aliquots</Panel.Heading>
                <Panel.Body>
                    {!stats && (
                        <span className="sample-aliquots-stats-empty">This sample has no aliquots.</span>
                    )}
                    {!!stats && (
                    <table className="table table-responsive table-condensed detail-component--table__fixed sample-aliquots-stats-table">
                        <tbody>
                            {this.renderStats(stats, hideAssayData)}
                        </tbody>
                    </table>
                    )}
                </Panel.Body>
            </Panel>
        );
    }
}

class SampleAliquotsSummaryImpl extends PureComponent<Props> {
    componentDidMount(): void {
        this.initModel();
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        if (this.props.sampleId !== prevProps.sampleId) {
            this.initModel();
        }
    }

    initModel(): void {
        const { actions, aliquotJobsQueryConfig } = this.props;
        actions.addModel(this.getAliquotQueryConfig(), true);
        if (aliquotJobsQueryConfig) actions.addModel(aliquotJobsQueryConfig, true);
    }

    getAliquotQueryConfig(): QueryConfig {
        const { sampleSet, sampleLsid } = this.props;
        return getSampleAliquotsQueryConfig(sampleSet, sampleLsid, false);
    }

    getQueryModel(index: number): QueryModel {
        return Object.values(this.props.queryModels)[index];
    }

    getAliquotQueryModel(): QueryModel {
        return this.getQueryModel(0);
    }

    getAliquotJobsQueryModel(): QueryModel {
        return this.getQueryModel(1);
    }

    render() {
        return (
            <SampleAliquotsSummaryWithModels
                {...this.props}
                aliquotsModel={this.getAliquotQueryModel()}
                jobsModel={this.getAliquotJobsQueryModel()}
            />
        );
    }
}

export const SampleAliquotsSummary = withQueryModels<OwnProps>(SampleAliquotsSummaryImpl);
