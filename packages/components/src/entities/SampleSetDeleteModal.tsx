import React, { FC, useCallback, useState } from 'react';

import { deleteErrorMessage, deleteSuccessMessage } from '../internal/util/messaging';
import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';
import { SHARED_CONTAINER_PATH } from '../internal/constants';

import { EntityTypeDeleteConfirmModal } from './EntityTypeDeleteConfirmModal';
import { Progress } from '../internal/components/base/Progress';

import { deleteSampleSet } from '../internal/components/samples/actions';

interface Props {
    afterDelete?: (success: boolean) => void;
    beforeDelete?: () => void;
    containerPath?: string;
    numSamples: number;
    onCancel: () => void;
    rowId: number;
}

export const SampleSetDeleteModal: FC<Props> = props => {
    const { beforeDelete, afterDelete, rowId, numSamples, onCancel, containerPath } = props;
    const { createNotification } = useNotificationsContext();
    const [showProgress, setShowProgress] = useState<boolean>();
    const isShared = containerPath === SHARED_CONTAINER_PATH;

    const onConfirm = useCallback(async (auditUserComment: string) => {
        beforeDelete?.();
        setShowProgress(true);

        try {
            await deleteSampleSet(rowId, containerPath, auditUserComment);
            afterDelete?.(true);
            createNotification(deleteSuccessMessage('sample type'));
        } catch (error) {
            afterDelete?.(false);
            createNotification({
                alertClass: 'danger',
                message: deleteErrorMessage('sample type'),
            });
        }
    }, [afterDelete, beforeDelete, containerPath, createNotification, rowId]);

    return (
        <>
            {!showProgress && (
                <EntityTypeDeleteConfirmModal
                    rowId={rowId}
                    isSample
                    noun="sample"
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                    isShared={isShared}
                />
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
