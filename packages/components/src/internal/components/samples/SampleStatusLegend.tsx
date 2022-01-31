import React, {FC, memo} from "react";

import { LoadingSpinner, caseInsensitive, SCHEMAS } from '../../../';

import {SampleStatusTag} from "./SampleStatusTag";
import {getSampleStatus} from "./utils";
import {InjectedQueryModels, withQueryModels} from "../../../public/QueryModel/withQueryModels";
import {QuerySort} from "../../../public/QuerySort";
import {isLoading} from "../../../public/LoadingState";

interface OwnProps {}

const SampleStatusLegendImpl: FC<OwnProps & InjectedQueryModels> = memo(props => {
    const { model } = props.queryModels;

    if (isLoading(model.rowsLoadingState)) {
        return <LoadingSpinner />;
    }

    if (model.rowCount === 0) {
        return (
            <table className="sample-status-legend--table">
                <tr>
                    <td>No sample statuses are defined.</td>
                </tr>
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
                        <td><SampleStatusTag status={status} hideDescription={true} /></td>
                        <td className="sample-status-legend--description">{caseInsensitive(row, 'Description')?.value}</td>
                    </tr>
                )
            })}
            </tbody>
        </table>
    )
});

const SampleStatusLegendWithQueryModels = withQueryModels<OwnProps>(SampleStatusLegendImpl);

export const SampleStatusLegend: FC<OwnProps> = () => {
    const queryConfigs = {
        model: {
            id: 'sample-statuses-model',
            schemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_STATUS,
            sorts: [
                new QuerySort({ fieldKey: 'StatusType' }),
                new QuerySort({ fieldKey: 'Label' }),
            ],
        },
    };
    return <SampleStatusLegendWithQueryModels autoLoad queryConfigs={queryConfigs} />
};
