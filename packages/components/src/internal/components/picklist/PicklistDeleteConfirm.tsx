import React, { FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { User } from '../base/models/User';
import { Alert } from '../base/Alert';
import { ConfirmModal } from '../base/ConfirmModal';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { getConfirmDeleteMessage } from '../../util/messaging';

import { Picklist } from './models';
import { getPicklistDeleteData, PicklistDeletionData } from './actions';

interface Props {
    model: QueryModel;
    user: User;
    useSelection: boolean;
    onConfirm: (listsToDelete: any[]) => void;
    onCancel: () => void;
}

interface DeleteConfirmMessageProps {
    deletionData: PicklistDeletionData;
    numSelected: number;
    noun: string;
}

// exported for jest testing
export const PicklistDeleteConfirmMessage: FC<DeleteConfirmMessageProps> = memo(props => {
    const { deletionData, numSelected, noun } = props;

    if (!deletionData) return null;

    let restrictionMessage = null;

    if (deletionData.numDeletable === 0) {
        if (numSelected > 1) {
            restrictionMessage = (
                <p>All of the selected picklists were created by other users and cannot be deleted.</p>
            );
        } else {
            restrictionMessage = <p>The selected picklist was created by another user and cannot be deleted.</p>;
        }
    } else if (deletionData.numNotDeletable > 0) {
        restrictionMessage = (
            <p>
                {deletionData.numNotDeletable} of the {numSelected} selected picklists
                {deletionData.numNotDeletable === 1 ? ' was created by another user' : ' were created by other users'}
                and cannot be deleted.
            </p>
        );
    }

    let publicMessage = null;
    if (deletionData.numDeletable > 0) {
        if (deletionData.numDeletable == deletionData.numShared) {
            if (deletionData.numShared === 1) {
                publicMessage = <p>This is a public picklist that is shared with your team members.</p>;
            } else {
                publicMessage = <p>These are public picklists that are shared with your team members.</p>;
            }
        } else if (deletionData.numShared) {
            publicMessage = (
                <p>
                    {deletionData.numShared} of the {deletionData.numDeletable} lists{' '}
                    {deletionData.numShared === 1 ? 'is a public picklist' : 'are public picklists'} shared with your
                    team members.
                </p>
            );
        }
    }

    const rUSure =
        deletionData.numDeletable === 0 ? null : (
            <>
                Are you sure you want to delete{' '}
                {deletionData.numDeletable === 1 && deletionData.deletableLists[0]?.name ? (
                    <b>"{deletionData.deletableLists[0].name}"</b>
                ) : (
                    'the selected lists'
                )}
                ?
            </>
        );

    return (
        <>
            {(publicMessage || restrictionMessage) && (
                <Alert bsStyle="warning">
                    {publicMessage}
                    {restrictionMessage}
                </Alert>
            )}
            <span>
                {deletionData.numDeletable > 0 && (
                    <>
                        {rUSure}&nbsp; Samples in the {noun} will not be affected.&nbsp;
                        {getConfirmDeleteMessage()}
                    </>
                )}
            </span>
        </>
    );
});

export const PicklistDeleteConfirm: FC<Props> = memo(props => {
    const { model, onConfirm, onCancel, useSelection, user } = props;
    const [errorMessage, setErrorMessage] = useState(undefined);
    const [nounAndNumber, setNounAndNumber] = useState('Picklist');
    const [deletionData, setDeletionData] = useState<PicklistDeletionData>(undefined);

    const numSelected = useSelection ? model.selections.size : 1;
    const noun = numSelected === 1 ? 'Picklist' : 'Picklists';
    const lcNoun = noun.toLowerCase();

    useEffect(() => {
        if (useSelection) {
            getPicklistDeleteData(model, user)
                .then(data => {
                    setNounAndNumber(data.numDeletable === 1 ? '1 Picklist' : data.numDeletable + ' Picklists');
                    setDeletionData(data);
                })
                .catch(() => {
                    setErrorMessage(
                        'There was a problem loading the deletion data. ' +
                            'Verify the ' +
                            lcNoun +
                            (model.selections.size === 1 ? ' is still valid and has ' : ' are still valid and have ') +
                            'not already been deleted.'
                    );
                });
        } else {
            setNounAndNumber('This Picklist');
            const picklist = Picklist.create(model.getRow());
            setDeletionData({
                numDeletable: 1,
                numNotDeletable: 0,
                numShared: picklist.isPublic() ? 1 : 0,
                deletableLists: [picklist],
            });
        }
    }, [model, user]);

    const onConfirmDelete = useCallback(() => {
        onConfirm(deletionData.deletableLists);
    }, [deletionData, onConfirm]);

    return (
        <ConfirmModal
            title={'Delete ' + nounAndNumber}
            onConfirm={deletionData?.numDeletable ? onConfirmDelete : undefined}
            onCancel={onCancel}
            confirmVariant="danger"
            confirmButtonText={'Yes, Delete ' + nounAndNumber}
            cancelButtonText="Cancel"
            submitting={!!errorMessage} // disable submit button if there are errors
        >
            {errorMessage}

            {errorMessage === undefined && deletionData && (
                <PicklistDeleteConfirmMessage deletionData={deletionData} numSelected={numSelected} noun={lcNoun} />
            )}

            {errorMessage === undefined && !deletionData && <LoadingSpinner />}
        </ConfirmModal>
    );
});
