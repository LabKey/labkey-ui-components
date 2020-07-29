import * as React from 'react'
import { useState } from 'react'
import {
    AssayRunDeleteConfirmModal,
    createDeleteErrorNotification,
    createDeleteSuccessNotification,
    deleteAssayRuns,
    Progress,
    QueryGridModel
} from "../..";

interface Props {
    model: QueryGridModel
    useSelected: boolean
    beforeDelete?: () => any
    afterDelete: () => any
    afterDeleteFailure: () => any
    onCancel: () => any
}

export function AssayRunDeleteModal(props: Props) {
    const { model, onCancel, afterDelete, afterDeleteFailure, beforeDelete, useSelected } = props;
    const [showProgress, setShowProgress] = useState<boolean>();

    const numToDelete = useSelected ? model.selectedIds.size : 1;
    const noun =  numToDelete === 1 ? ' assay run' : ' assay runs';

    function onConfirm() {
        setShowProgress(true);
        beforeDelete && beforeDelete();

        const selectionKey = useSelected ? model.getId(): undefined;
        const selectedRowId = useSelected ? undefined : model.getRow(0).getIn(['RowId', 'value']);
        deleteAssayRuns(selectionKey, selectedRowId, true).then((response) => {
            const numRunsCascadeDeleted = response.hasOwnProperty('runIdsCascadeDeleted') ? response.runIdsCascadeDeleted.length : 0;
            const additionalInfo = numRunsCascadeDeleted > 0 ? ' In addition, ' + numRunsCascadeDeleted + ' replaced ' + (numRunsCascadeDeleted === 1 ? 'run was' : 'runs were') + ' also deleted.' : '';

            afterDelete();
            createDeleteSuccessNotification(noun, numToDelete, additionalInfo);
        }).catch( (reason) => {
            console.error(reason);
            setShowProgress(false);
            createDeleteErrorNotification(noun);
            afterDeleteFailure();
        });
    }

    return (
        <>
            {!showProgress &&
            <AssayRunDeleteConfirmModal
                numToDelete={numToDelete}
                onConfirm={onConfirm}
                onCancel={onCancel}
            />
            }
            <Progress
                modal={true}
                estimate={numToDelete * 10}
                title={'Deleting ' + numToDelete + noun}
                toggle={showProgress}
            />
        </>
    )
}
