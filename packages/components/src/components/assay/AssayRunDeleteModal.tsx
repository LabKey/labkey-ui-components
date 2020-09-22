import * as React from 'react'
import { useState } from 'react'
import {
    createDeleteErrorNotification,
    createDeleteSuccessNotification,
    deleteAssayRuns,
    Progress,
    QueryGridModel
} from "../..";
import {AssayRunDeleteConfirmModal} from "./AssayRunDeleteConfirmModal";

interface Props {
    afterDelete: () => any;
    afterDeleteFailure: () => any;
    numToDelete: number;
    onCancel: () => any;
    selectionKey?: string;
    selectedRowId?: string;
}

export function AssayRunDeleteModal(props: Props) {
    const { afterDelete, afterDeleteFailure, numToDelete, onCancel, selectionKey, selectedRowId } = props;
    const [showProgress, setShowProgress] = useState<boolean>();
    const noun =  numToDelete === 1 ? ' assay run' : ' assay runs';

    function onConfirm() {
        setShowProgress(true);
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
