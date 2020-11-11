import React, { FC, memo, useEffect } from 'react'
import {
    SCHEMAS,
    Alert,
    naturalSort,
    LoadingSpinner,
    Cards,
} from '../../..';

// These need to be direct imports from files to avoid circular dependencies in index.ts
import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';

const rowSort = (row1, row2): number => {
    return naturalSort(getSampleSetName(row1), getSampleSetName(row2));
}

const getSampleSetName = (row): string => {
    return row.Name.value;
}

const getSampleSetCount = (row): number => {
    return row.SampleCount.value;
}

const getSampleSetDescription = (row): string => {
    return row.Description.value;
}

const getSampleSetCard = (row): Object => {
    const name = getSampleSetName(row);
    const sampleCount = getSampleSetCount(row);
    const description = getSampleSetDescription(row);
    const href = row.Name.url;
    const noSamples = sampleCount === 0;

    return {
        title: name,
        caption: noSamples ? description : 'Sample count: ' + sampleCount,
        iconSrc: noSamples ? 'sample_set_gray' : 'sample_set',
        disabled: noSamples,
        href
    }
}

const getNonEmptySampleSetCards = (data: Array<{ [key: string]: any}>): any[] => {

    return data
        .filter((row) => getSampleSetCount(row) > 0)
        .sort((row1, row2) => rowSort(row1, row2))
        .map((row) => getSampleSetCard(row));
}

const getEmptySampleSetCards = (data: Array<{ [key: string]: any}>): any[] => {

    return data
        .filter((row) => getSampleSetCount(row) === 0)
        .sort((row1, row2) => rowSort(row1, row2))
        .map((row) => getSampleSetCard(row));
}

interface Props {
    modelId: string
}

const SampleSetCardsImpl: FC<Props & InjectedQueryModels> = memo(props => {
    const { actions, modelId, queryModels } = props;

    const model = queryModels[modelId];

    useEffect(() => {
        actions.loadModel(modelId);
    }, [])

    const emptyDisplay = <Alert bsStyle={'warning'}>No sample types have been created.</Alert>;

    let nonEmptyCards, emptyCards;
    if (!model.isLoading) {
        nonEmptyCards = getNonEmptySampleSetCards(model.gridData);
        emptyCards = getEmptySampleSetCards(model.gridData);
    }

    return (
        <>
            {model.isLoading && <LoadingSpinner/>}
            {nonEmptyCards && emptyCards && (nonEmptyCards.length + emptyCards.length) === 0 && emptyDisplay}
            {nonEmptyCards && nonEmptyCards.length > 0 &&
            <div style={{paddingTop: '6px'}}>
                <h4>Sample types with samples</h4>
                <Cards cards={nonEmptyCards}/>
            </div>}
            {emptyCards && emptyCards.length > 0 &&
            <div style={{paddingTop: '10px'}}>
                <h4>Sample types without any samples</h4>
                <Cards cards={emptyCards}/>
            </div>}
        </>
    )

});

const SampleSetCardsWithQueryModels = withQueryModels<Props>(SampleSetCardsImpl)

export const SampleSetCards: FC = memo(() => {
    const modelId = 'samplesets-cards';
    const queryConfigs = {
        [modelId]: {
            schemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_SETS
        }
    }

    return (
        <SampleSetCardsWithQueryModels queryConfigs={queryConfigs} modelId={modelId} />
    )
});