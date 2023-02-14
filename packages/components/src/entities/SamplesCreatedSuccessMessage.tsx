import React, { FC, useCallback, useState } from 'react';
import { withRouter, WithRouterProps } from 'react-router';

import { Actions } from '../public/QueryModel/withQueryModels';
import { SchemaQuery } from '../public/SchemaQuery';
import { AppURL } from '../internal/url/AppURL';
import { SAMPLES_KEY } from '../internal/app/constants';
import { SCHEMAS } from '../internal/schemas';
import { selectGridIdsFromTransactionId, setSnapshotSelections } from '../internal/actions';
import { createGridModelId } from '../internal/models';
import { Alert } from '../internal/components/base/Alert';
import { resolveErrorMessage } from '../internal/util/messaging';

async function selectSamplesAndAddToStorage(
    targetSampleTypeName: string,
    sampleCount: number,
    transactionAuditId: number,
    sampleListingGridId: string,
    actions: Actions
): Promise<AppURL> {
    const schemaQuery = SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, targetSampleTypeName);

    const selected = await selectGridIdsFromTransactionId(
        sampleListingGridId,
        schemaQuery,
        transactionAuditId,
        SAMPLES_KEY,
        actions
    );

    await setSnapshotSelections(createGridModelId(sampleListingGridId, schemaQuery), selected);

    // show AddSamplesToStorageModal
    return AppURL.create(SAMPLES_KEY, targetSampleTypeName).addParam('addToStorageCount', sampleCount);
}

export interface SamplesCreatedSuccessMessageProps {
    actions: Actions;
    createdSampleCount: number;
    importedSampleCount: number;
    nounPlural?: string;
    nounSingular?: string;
    sampleListingGridId: string;
    sampleType: string;
    showAddToStorage: boolean;
    transactionAuditId: number;
}

const SamplesCreatedSuccessMessageImpl: FC<SamplesCreatedSuccessMessageProps & WithRouterProps> = props => {
    const {
        actions,
        createdSampleCount,
        importedSampleCount,
        nounPlural = 'samples',
        nounSingular = 'sample',
        router,
        sampleListingGridId,
        sampleType,
        showAddToStorage,
        transactionAuditId,
    } = props;

    const [error, setError] = useState<string>();
    const count = createdSampleCount > 0 ? createdSampleCount : importedSampleCount;
    const noun = (count === 1 ? ' ' + nounSingular : ' ' + nounPlural).toLowerCase();
    const itThem = count === 1 ? 'it' : 'them';
    const action = createdSampleCount > 0 ? 'created' : 'imported';

    const onAddToStorage = useCallback(async () => {
        try {
            const url = await selectSamplesAndAddToStorage(
                sampleType,
                count,
                transactionAuditId,
                sampleListingGridId,
                actions
            );
            router.push(url.toString());
        } catch (e) {
            setError(resolveErrorMessage(e));
        }
    }, [actions, count, router, sampleListingGridId, sampleType, transactionAuditId]);

    const onSelectInGrid = useCallback(() => {
        try {
            selectGridIdsFromTransactionId(
                sampleListingGridId,
                SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType),
                transactionAuditId,
                SAMPLES_KEY,
                actions
            );
        } catch (e) {
            setError(resolveErrorMessage(e));
        }
    }, [actions, sampleListingGridId, sampleType, transactionAuditId]);

    if (error) {
        return <Alert>{error}</Alert>;
    }

    return (
        <>
            Successfully {action} {count} {noun}.&nbsp;
            {showAddToStorage && (
                <>
                    <a onClick={onAddToStorage}>Add {itThem} to storage</a>
                    &nbsp;now or
                </>
            )}
            {transactionAuditId && (
                <>
                    <a onClick={onSelectInGrid}>
                        &nbsp;{showAddToStorage ? 'select' : 'Select'} {itThem} in the grid&nbsp;
                    </a>
                </>
            )}
            to work with {itThem}.
        </>
    );
};

export const SamplesCreatedSuccessMessage = withRouter<SamplesCreatedSuccessMessageProps>(
    SamplesCreatedSuccessMessageImpl
);
