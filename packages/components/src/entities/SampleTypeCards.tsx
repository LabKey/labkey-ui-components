import React, { FC, memo, useMemo } from 'react';

import { Query } from '@labkey/api';

import { Cards, ICardProps } from '../internal/components/base/Cards';

import { caseInsensitive } from '../internal/util/utils';
import { naturalSort } from '../public/sort';

import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';
import { SCHEMAS } from '../internal/schemas';

import { InjectedQueryModels, withQueryModels } from '../public/QueryModel/withQueryModels';

import { SampleTypeEmptyAlert } from '../internal/components/samples/SampleEmptyAlert';
import { NON_MEDIA_SAMPLE_TYPES_FILTER } from '../internal/components/samples/constants';

const getSampleTypeCount = (row: Record<string, any>): number => {
    return caseInsensitive(row, 'SampleCount').value;
};

const getSampleTypeDescription = (row: Record<string, any>): string => {
    return caseInsensitive(row, 'Description').value;
};

const getSampleTypeName = (row: Record<string, any>): string => {
    return caseInsensitive(row, 'Name').value;
};

const rowSort = (row1: Record<string, any>, row2: Record<string, any>): number => {
    return naturalSort(getSampleTypeName(row1), getSampleTypeName(row2));
};

const getSampleTypeCard = (row: Record<string, any>): ICardProps => {
    const sampleCount = getSampleTypeCount(row);
    const noSamples = sampleCount === 0;

    return {
        caption: noSamples ? getSampleTypeDescription(row) : 'Sample count: ' + sampleCount,
        disabled: noSamples,
        href: caseInsensitive(row, 'Name').url,
        iconSrc: noSamples ? 'sample_set_gray' : 'sample_set',
        title: getSampleTypeName(row),
    };
};

const getNonEmptySampleTypeCards = (data: Array<{ [key: string]: any }>): ICardProps[] => {
    return data
        .filter(row => getSampleTypeCount(row) > 0)
        .sort(rowSort)
        .map(getSampleTypeCard);
};

const getEmptySampleTypeCards = (data: Array<{ [key: string]: any }>): ICardProps[] => {
    return data
        .filter(row => getSampleTypeCount(row) === 0)
        .sort(rowSort)
        .map(getSampleTypeCard);
};

interface Props {
    modelId: string;
}

const SampleTypeCardsImpl: FC<Props & InjectedQueryModels> = memo(({ modelId, queryModels }) => {
    const model = queryModels[modelId];

    const { emptyCards, nonEmptyCards } = useMemo(
        () => ({
            emptyCards: model.isLoading ? undefined : getEmptySampleTypeCards(model.gridData),
            nonEmptyCards: model.isLoading ? undefined : getNonEmptySampleTypeCards(model.gridData),
        }),
        [model.isLoading]
    );

    return (
        <>
            {model.isLoading && <LoadingSpinner />}
            {nonEmptyCards && emptyCards && nonEmptyCards.length + emptyCards.length === 0 && <SampleTypeEmptyAlert />}
            {nonEmptyCards && nonEmptyCards.length > 0 && (
                <div style={{ paddingTop: '6px' }}>
                    <h4>Sample types with samples</h4>
                    <Cards cards={nonEmptyCards} />
                </div>
            )}
            {emptyCards && emptyCards.length > 0 && (
                <div style={{ paddingTop: '10px' }}>
                    <h4>Sample types without any samples</h4>
                    <Cards cards={emptyCards} />
                </div>
            )}
        </>
    );
});

const SampleTypeCardsWithQueryModels = withQueryModels<Props>(SampleTypeCardsImpl);


export const SampleTypeCards: FC = memo(() => {
    const modelId = 'sample-type-cards';
    const queryConfigs = {
        [modelId]: {
            schemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_SETS,
            baseFilters: [NON_MEDIA_SAMPLE_TYPES_FILTER],
            containerFilter: Query.containerFilter.currentPlusProjectAndShared,
        },
    };

    return <SampleTypeCardsWithQueryModels autoLoad modelId={modelId} queryConfigs={queryConfigs} />;
});
