import React from 'react';
import { Utils } from '@labkey/api';
import { ConfirmModal } from '../base/ConfirmModal';
import { getSelectedUserIds, deleteUsers } from "./actions";
import { QueryGridModel } from "../base/models/model";
import { Alert } from "../base/Alert";

interface Props {
    model: QueryGridModel
    onComplete: (response: any) => any
    onCancel: () => any
}

interface State {
    submitting: boolean
    error: string
}

export class UserDeleteConfirmModal extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            submitting: false,
            error: undefined
        }
    }

    onConfirm = () => {
        const { model, onComplete } = this.props;
        const userIds = getSelectedUserIds(model);

        this.setState(() => ({submitting: true}));
        deleteUsers(userIds)
            .then(onComplete)
            .catch(error => {
                console.error(error);
                this.setState(() => ({error: error.exception, submitting: false}));
            });
    };

    render() {
        const { onCancel, model } = this.props;
        const { error, submitting } = this.state;
        const userCount = model.selectedIds.size;

        return (
            <ConfirmModal
                title={'Delete ' + Utils.pluralBasic(userCount, 'User') +  '?'}
                msg={
                    <>
                        <p>
                            Deletion of a user is <b>permanent and cannot be undone</b>. The user's display name will no
                            longer be displayed with actions taken or data uploaded by that user. Also, group membership
                            and permission settings for the deleted users will be lost. You cannot reactivate a deleted
                            user to restore this information.
                        </p>
                        <p>
                            Generally, <b>deactivation of a user is recommended</b>. Deactivated users may not login,
                            but their information will be preserved for display purposes, and their group memberships
                            will be preserved in case they are reactivated at a later time.
                        </p>
                        <p>
                            {Utils.pluralBasic(userCount, 'user')} will be deleted. Do you want to proceed?
                        </p>
                        {error && <Alert>{error}</Alert>}
                    </>
                }
                onConfirm={this.onConfirm}
                onCancel={onCancel}
                confirmVariant={'danger'}
                confirmButtonText={'Yes, Permanently Delete'}
                cancelButtonText={'Cancel'}
                submitting={submitting}
            />
        )
    }
}
