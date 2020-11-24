import React, { FC, useCallback, useState } from 'react';

import {
    deleteSampleSet,
    EntityTypeDeleteConfirmModal,
    Progress,
    createDeleteErrorNotification,
    createDeleteSuccessNotification,
} from '../../..';

interface Props {
    afterDelete?: (success: boolean) => void;
    beforeDelete?: () => void;
    onCancel: () => void;
    rowId: number;
    numSamples: number;
}

export const SampleSetDeleteModal: FC<Props> = props => {
    const { beforeDelete, afterDelete, rowId, numSamples, onCancel } = props;
    const [showProgress, setShowProgress] = useState<boolean>();

    const onConfirm = useCallback(async () => {
        beforeDelete?.();
        setShowProgress(true);

        try {
            await deleteSampleSet(rowId);
            afterDelete?.(true);
            createDeleteSuccessNotification(' sample type');
        } catch (error) {
            afterDelete?.(false);
            createDeleteErrorNotification('sample type');
        }
    }, [beforeDelete, setShowProgress]);

    return (
        <>
            {!showProgress && (
                <EntityTypeDeleteConfirmModal rowId={rowId} noun="sample" onConfirm={onConfirm} onCancel={onCancel} />
            )}
            <Progress
                delay={0}
                estimate={numSamples * 10}
                modal={true}
                title="Deleting sample type"
                toggle={showProgress}
            />
        </>
    );
};
