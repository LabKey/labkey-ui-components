import React, { FC, memo } from 'react'
import { Alert, AppURL, SCHEMAS, HeatMap, App, HeatMapCell } from '../../..';

interface Props {
    navigate: (url: AppURL) => any
}

const getAssayUrl = (provider: string, protocol: string, page?: string): AppURL => {
    if (provider && protocol) {
        if (page)
            return AppURL.create(App.ASSAYS_KEY, provider, protocol, page);
        return  AppURL.create(App.ASSAYS_KEY, provider, protocol);
    }
    return undefined;
}

const getCellUrl = (row: { [key: string]: any }) => {
    const protocolName = row.Protocol?.displayValue;
    const providerName = row.Provider.value;
    return getAssayUrl(providerName, protocolName, 'runs');
};

const getHeaderUrl = (cell: HeatMapCell) => {
    const provider = cell.providerName;
    const protocol = cell.protocolName;
    return getAssayUrl(provider, protocol);
};

const getTotalUrl = (cell: HeatMapCell) => {
    const provider = cell.providerName;
    const protocol = cell.protocolName;
    return getAssayUrl(provider, protocol, 'runs');
};

const emptyDisplay = <Alert bsStyle={'warning'}>No assay runs have been imported within the last 12 months.</Alert>;

export const AssaysHeatMap: FC<Props> = memo((props) => {
    const { navigate } = props;

    return (
        <HeatMap
            schemaQuery={SCHEMAS.EXP_TABLES.ASSAY_HEAT_MAP}
            nounSingular={'run'}
            nounPlural={'runs'}
            yAxis={'protocolName'}
            xAxis={'monthName'}
            measure={'monthTotal'}
            yInRangeTotal={'InRangeTotal'}
            yTotalLabel={'12 month total runs'}
            getCellUrl={getCellUrl}
            getHeaderUrl={getHeaderUrl}
            getTotalUrl={getTotalUrl}
            headerClickUrl={AppURL.create('q', 'exp', 'assayruns')}
            emptyDisplay={emptyDisplay}
            navigate={navigate}
        />
    )

})
