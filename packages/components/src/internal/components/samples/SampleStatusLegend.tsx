import React, { FC, memo } from 'react';

import { QuerySort } from '../../../public/QuerySort';
import { isLoading } from '../../../public/LoadingState';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { caseInsensitive } from '../../util/utils';
import { SCHEMAS } from '../../schemas';

import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';

import { SampleStatusTag } from './SampleStatusTag';
import { getSampleStatus, getSampleStatusContainerFilter } from './utils';

export const SAMPLE_STATUS_LEGEND = 'SampleStatusLegend';

// export for jest testing
export const SampleStatusLegendImpl: FC<InjectedQueryModels> = memo(props => {
    const { model } = props.queryModels;

    if (isLoading(model.rowsLoadingState)) {
        return <LoadingSpinner />;
    }

    if (model.rowCount === 0) {
        return (
            <table className="sample-status-legend--table">
                <tbody>
                    <tr>
                        <td>No sample statuses are defined.</td>
                    </tr>
                </tbody>
            </table>
        );
    }

    return (
        <table className="sample-status-legend--table">
            <tbody>
                {model.gridData.map(row => {
                    const status = getSampleStatus(row);
                    return (
                        <tr key={status.label}>
                            <td>
                                <SampleStatusTag status={status} hideDescription />
                            </td>
                            <td className="sample-status-legend--description">
                                {caseInsensitive(row, 'Description')?.value}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
});

const SampleStatusLegendWithQueryModels = withQueryModels(SampleStatusLegendImpl);

export const SampleStatusLegend: FC = () => {
    const queryConfigs = {
        model: {
            id: 'sample-statuses-model',
            schemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_STATUS,
            containerFilter: getSampleStatusContainerFilter(true),
            maxRows: -1,
            sorts: [new QuerySort({ fieldKey: 'StatusType' }), new QuerySort({ fieldKey: 'Label' })],
        },
    };
    return <SampleStatusLegendWithQueryModels autoLoad queryConfigs={queryConfigs} />;
};
