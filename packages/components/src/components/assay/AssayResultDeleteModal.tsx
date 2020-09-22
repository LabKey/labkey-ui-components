import * as React from 'react'
import { useState } from 'react'
import {
    ConfirmModal,
    createDeleteErrorNotification,
    createDeleteSuccessNotification,
    deleteRows,
    Progress,
    SchemaQuery
} from "../..";
import {AssayResultDeleteConfirmModal} from "./AssayResultDeleteConfirmModal";

interface Props {
    afterDelete: () => any;
    afterDeleteFailure: () => any;
    maxToDelete?: number;
    onCancel: () => any;
    schemaQuery: SchemaQuery;
    selectedIds: string[];
}

export function AssayResultDeleteModal(props: Props) {
    const { onCancel, afterDelete, afterDeleteFailure, maxToDelete, schemaQuery, selectedIds } = props;
    const [showProgress, setShowProgress] = useState<boolean>();
    const numToDelete = selectedIds.length;
    const noun = numToDelete ? ' assay result' : ' assay results';

    function onConfirm() {
        setShowProgress(true);
        const rows = selectedIds.map((id) => ({'RowId': id}));
        deleteRows({
            schemaQuery,
            rows
        }).then((response) => {
            afterDelete();
            createDeleteSuccessNotification(noun, numToDelete);
        }).catch( (reason) => {
            console.error(reason);
            setShowProgress(false);
            createDeleteErrorNotification(noun);
            afterDeleteFailure();
        });
    }

    if (maxToDelete && numToDelete > maxToDelete) {
        return (
            <ConfirmModal
                title={"Cannot Delete Assay Results"}
                onCancel={onCancel}
                msg={"You cannot delete more than " + maxToDelete + " individual assay results at a time.  "
                + " Please select fewer results and try again."}
                onConfirm={undefined}
                cancelButtonText={"Dismiss"}
            />
        )
    }

    return (
        <>
            {!showProgress &&
                <AssayResultDeleteConfirmModal
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