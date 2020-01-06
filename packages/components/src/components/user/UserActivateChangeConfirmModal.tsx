import React from 'react';
import { Utils } from '@labkey/api';
import { ConfirmModal } from '../base/ConfirmModal';
import { getSelectedUserIds, updateUsersActiveState } from "./actions";
import { QueryGridModel } from "../base/models/model";
import { Alert } from "../base/Alert";

interface Props {
    model: QueryGridModel
    reactivate: boolean
    onComplete: (response: any) => any
    onCancel: () => any
}

interface State {
    submitting: boolean
    error: string
}

export class UserActivateChangeConfirmModal extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            submitting: false,
            error: undefined
        }
    }

    onConfirm = () => {
        const { model, reactivate, onComplete } = this.props;
        const userIds = getSelectedUserIds(model);

        this.setState(() => ({submitting: true}));
        updateUsersActiveState(userIds, reactivate)
            .then(onComplete)
            .catch(error => {
                console.error(error);
                this.setState(() => ({error: (error ? error.exception : 'Unknown error'), submitting: false}));
            });
    };

    render() {
        const { onCancel, model, reactivate } = this.props;
        const { error, submitting } = this.state;
        const userCount = model.selectedIds.size;
        const action = reactivate ? 'Reactivate' : 'Deactivate';

        return (
            <ConfirmModal
                title={action + ' ' + Utils.pluralBasic(userCount, 'User') +  '?'}
                msg={
                    <>
                        {!reactivate && <p>
                            Deactivated users will <b>no longer be able to login</b>. However, their information will be
                            preserved for display purposes, and their group memberships and role assignments will be
                            preserved in case they are reactivated at a later time.
                        </p>}
                        {reactivate && <p>
                            Reactivated users will be able to <b>login normally</b>, and all their previous group memberships
                            and role assignments will apply.
                        </p>}
                        <p>
                            {Utils.pluralBasic(userCount, 'user')} will be updated. Do you want to proceed?
                        </p>
                        {error && <Alert>{error}</Alert>}
                    </>
                }
                onConfirm={this.onConfirm}
                onCancel={onCancel}
                confirmVariant={reactivate ? 'success' : 'danger'}
                confirmButtonText={'Yes, ' + action}
                cancelButtonText={'Cancel'}
                submitting={submitting}
            />
        )
    }
}
