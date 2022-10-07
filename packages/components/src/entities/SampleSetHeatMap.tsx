import React, { FC, memo, useMemo } from 'react';
import { Filter } from '@labkey/api';

import { SAMPLES_KEY } from '../internal/app/constants';

import { AppURL } from '../internal/url/AppURL';
import { HeatMap, HeatMapCell } from '../internal/components/heatmap/HeatMap';
import { User } from '../internal/components/base/models/User';
import { SCHEMAS } from '../internal/schemas';

import { SampleEmptyAlert } from '../internal/components/samples/SampleEmptyAlert';

const getCellUrl = (row: Record<string, any>): AppURL => {
    const protocolName = row.Protocol?.displayValue;
    return protocolName ? AppURL.create(SAMPLES_KEY, protocolName.toLowerCase()) : undefined;
};

const getHeaderAndTotalUrl = (cell: HeatMapCell): AppURL => cell?.url;

interface Props {
    excludedSampleSets?: string[];
    navigate: (url: AppURL) => any;
    user: User;
}

export const SampleSetHeatMap: FC<Props> = memo(({ excludedSampleSets, navigate, user }) => {
    const emptyDisplay = (
        <SampleEmptyAlert user={user} message="No samples have been created within the last 12 months." />
    );

    const filters = useMemo(() => {
        if (!excludedSampleSets) return undefined;

        return [Filter.create('Name', excludedSampleSets, Filter.Types.NOT_IN)];
    }, [excludedSampleSets]);

    return (
        <HeatMap
            schemaQuery={SCHEMAS.EXP_TABLES.SAMPLE_SET_HEAT_MAP}
            filters={filters}
            nounSingular="sample"
            nounPlural="samples"
            yAxis="protocolName"
            xAxis="monthName"
            measure="monthTotal"
            yInRangeTotal="InRangeTotal"
            yTotalLabel="12 month total samples"
            getCellUrl={getCellUrl}
            getHeaderUrl={getHeaderAndTotalUrl}
            getTotalUrl={getHeaderAndTotalUrl}
            headerClickUrl={AppURL.create('q', 'exp', 'materials')}
            emptyDisplay={emptyDisplay}
            navigate={navigate}
        />
    );
});
