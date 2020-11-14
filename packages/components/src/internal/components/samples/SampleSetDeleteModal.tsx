import * as React from 'react'
import { useState } from "react";
import {
    deleteSampleSet,
    EntityTypeDeleteConfirmModal,
    Progress,
    createDeleteErrorNotification,
    createDeleteSuccessNotification
} from '../../..';

interface Props {
    rowId: number
    numSamples: number
    beforeDelete: () => any
    afterDelete: (success: boolean) => any
    onCancel: () => any
}

export function SampleSetDeleteModal(props: Props) {
    const { beforeDelete, afterDelete, rowId, numSamples, onCancel } = props;
    const [showProgress, setShowProgress] = useState<boolean>();

    function onConfirm() {
        setShowProgress(true);
        beforeDelete();

        deleteSampleSet(rowId)
            .then(() => {
                afterDelete(true);
                createDeleteSuccessNotification(' sample type');
            })
            .catch((error) => {
                afterDelete(false);
                createDeleteErrorNotification('sample type');
            });
    }

    return (
        <>
            {!showProgress &&
                <EntityTypeDeleteConfirmModal
                    rowId={rowId}
                    noun={'sample'}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                />
            }
            <Progress
                modal={true}
                delay={0}
                estimate={numSamples * 10}
                title={'Deleting sample type'}
                toggle={showProgress}
            />
        </>
    )
}