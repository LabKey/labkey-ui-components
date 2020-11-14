import React, {FC, memo, useMemo} from 'react'
import {AppURL, SCHEMAS, User, HeatMap, App, HeatMapCell} from '../../..';
import { Filter } from '@labkey/api';

import { SampleEmptyAlert } from "./SampleEmptyAlert";

const getCellUrl = (row: { [key: string]: any }) => {
    const protocolName = row.Protocol?.displayValue;
    return protocolName ? AppURL.create(App.SAMPLES_KEY, protocolName.toLowerCase()) : undefined;
};

const getHeaderAndTotalUrl = (cell: HeatMapCell) => {
    return cell?.url;
};

interface Props {
    navigate: (url: AppURL) => any,
    user: User,
    excludedSampleSets?: string[]
}

export const SampleSetHeatMap: FC<Props> = memo(props => {
    const { excludedSampleSets } = props;

    const emptyDisplay = <SampleEmptyAlert user={props.user}
                                           message={'No samples have been created within the last 12 months.'}/>;

    const filters = useMemo(() => {
        if (!excludedSampleSets)
            return undefined;

        return [Filter.create('Name', excludedSampleSets, Filter.Types.NOT_IN)]
    }, [excludedSampleSets])

    return (
        <HeatMap
            schemaQuery={SCHEMAS.EXP_TABLES.SAMPLE_SET_HEAT_MAP}
            filters={filters}
            nounSingular={'sample'}
            nounPlural={'samples'}
            yAxis={'protocolName'}
            xAxis={'monthName'}
            measure={'monthTotal'}
            yInRangeTotal={'InRangeTotal'}
            yTotalLabel={'12 month total samples'}
            getCellUrl={getCellUrl}
            getHeaderUrl={getHeaderAndTotalUrl}
            getTotalUrl={getHeaderAndTotalUrl}
            headerClickUrl={AppURL.create('q', 'exp', 'materials')}
            emptyDisplay={emptyDisplay}
            navigate={props.navigate}
        />
    )
});
