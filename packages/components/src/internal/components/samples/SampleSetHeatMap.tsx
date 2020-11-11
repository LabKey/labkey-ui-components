import React, { FC, memo } from 'react'
import {AppURL, SCHEMAS, User, HeatMap, App, HeatMapCell} from '../../..';

import { SampleEmptyAlert } from "./SampleEmptyAlert";

const getCellUrl = (row: { [key: string]: any }) => {
    const protocolName = row.Protocol?.displayValue;
    return protocolName ? AppURL.create(App.SAMPLES_KEY, protocolName.toLowerCase()) : undefined;
};

const getHeaderAndTotalUrl = (cell: HeatMapCell) => {
    return cell?.url;
};

interface Props {
    navigate: (url: AppURL) => any
    user: User
}

export const SampleSetHeatMap: FC<Props> = memo(props => {

    const emptyDisplay = <SampleEmptyAlert user={props.user}
                                           message={'No samples have been created within the last 12 months.'}/>;

    return (
        <HeatMap
            schemaQuery={SCHEMAS.EXP_TABLES.SAMPLE_SET_HEAT_MAP}
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