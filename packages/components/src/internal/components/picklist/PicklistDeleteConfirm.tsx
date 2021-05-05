import React, { FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { getPicklistDeleteData, PicklistDeletionData } from './actions';
import { PicklistModel } from './models';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { Actions } from '../../../public/QueryModel/withQueryModels';
import { User } from '../base/models/User';
import { Alert } from '../base/Alert';
import { ConfirmModal } from '../base/ConfirmModal';
import { LoadingSpinner } from '../base/LoadingSpinner';


interface Props {
    model: QueryModel,
    actions: Actions,
    user: User,
    useSelection: boolean,
    onConfirm: (listsToDelete: any[]) => void,
    onCancel: () => void
}

export const PicklistDeleteConfirm: FC<Props> = memo(props => {

    const { model, actions, onConfirm, onCancel, useSelection, user } = props;
    const [ errorMessage, setErrorMessage ] = useState(undefined);
    const [ nounAndNumber, setNounAndNumber ] = useState('Picklist');
    const [ deletionData, setDeletionData ]  = useState<PicklistDeletionData>(undefined);

    const numSelected = useSelection ? model.selections.size : 1;
    const noun = (numSelected === 1) ? 'Picklist' : 'Picklists';
    const lcNoun = noun.toLowerCase();

    useEffect(() =>  {
        if (useSelection) {
            getPicklistDeleteData(model, actions, user)
                .then(data => {
                    setNounAndNumber(data.numDeletable === 1 ? '1 Picklist' : data.numDeletable + ' Picklists');
                    setDeletionData(data);
                })
                .catch(() => {
                    setErrorMessage("There was a problem loading the deletion data. " +
                        "Verify the " + lcNoun +
                        (model.selections.size === 1 ? " is still valid and has " : " are still valid and have ")
                        + "not already been deleted.");
                });
        }
        else {
            setNounAndNumber('This Picklist');
            const picklist = new PicklistModel(model.getRow(undefined, true));
            setDeletionData({
                numDeletable: 1,
                numNotDeletable: 0,
                numShared: picklist.isPublic() ? 1 : 0,
                deletableLists: [picklist]
            });
        }
    }, [model, actions, user]);

    const onConfirmDelete = useCallback(() => {
        onConfirm(deletionData.deletableLists);
    }, [deletionData, onConfirm]);

    const getConfirmMessage = useMemo((): ReactNode => {
        if (!deletionData)
            return null;

        let restrictionMessage = '';

        if (deletionData.numDeletable === 0) {
            if (numSelected > 1) {
                restrictionMessage += 'None of the selected picklists can be deleted.';
            }
            else {
                restrictionMessage += 'The selected picklist cannot be deleted.';
            }
        }
        if (deletionData.numNotDeletable > 0) {
            if (deletionData.numDeletable > 0) {
                restrictionMessage += 'Only ' + deletionData.numDeletable + ' of the ' + numSelected + ' selected picklists can be deleted.';
            }
            restrictionMessage += " You are not allowed to delete picklists created by other users.  ";
        }
        const rUSure = deletionData.numDeletable === 0 ? null : (
            <>
                Are you sure you want to delete&nbsp;
                {deletionData.numDeletable === 1 && deletionData.deletableLists[0]?.name ?
                    <b>"{deletionData.deletableLists[0].name}"</b> :
                    'the selected lists'
                }
                ?
            </>
        );
        let publicMessage = null;
        if (deletionData.numDeletable == deletionData.numShared) {
            if (deletionData.numShared === 1)
                publicMessage = "This is a public picklist that is shared with your team members.";
            else
                publicMessage = "These are public picklists that are shared with your team members.";
        } else {
            publicMessage = deletionData.numShared + " of the " + deletionData.numDeletable + " lists " + (deletionData.numShared === 1 ? "is a public picklist" : "are public picklists") + " shared with your team members.";
        }
        return (
            <>
                <Alert bsStyle="warning">{publicMessage}</Alert>
                <span>
                    {restrictionMessage}
                    {rUSure}&nbsp;
                    {deletionData.numDeletable > 0 &&
                    <>
                        Samples in the {lcNoun} will not be affected.&nbsp;
                        <p className={'top-spacing'}>
                            <strong>Deletion cannot be undone.</strong>
                            &nbsp;Do you want to proceed?
                        </p>
                    </>}
                </span>
            </>
        );
    }, [deletionData, lcNoun]);

    return (
        <ConfirmModal
            title={"Delete " + nounAndNumber}
            msg={
                errorMessage ?? getConfirmMessage ?? <LoadingSpinner />
            }
            onConfirm={deletionData?.numDeletable ? onConfirmDelete : undefined}
            onCancel={onCancel}
            confirmVariant='danger'
            confirmButtonText={'Yes, Delete ' + nounAndNumber}
            cancelButtonText='Cancel'
            submitting={!!errorMessage }
        />
    )
});
