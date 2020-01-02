import React from 'react';
import { Utils } from '@labkey/api';
import { ConfirmModal } from '../base/ConfirmModal';

interface Props {
    userCount: number
    activate: boolean
    onConfirm: (activate: boolean) => any
    onCancel: () => any
}

export class UserActivateChangeConfirmModal extends React.Component<Props, any> {

    render() {
        const { onConfirm, onCancel, userCount, activate } = this.props;
        const action = activate ? 'Reactivate' : 'Deactivate';

        return (
            <ConfirmModal
                title={action + ' ' + Utils.pluralBasic(userCount, 'User') +  '?'}
                msg={
                    <>
                        {!activate && <p>
                            Deactivated users will no longer be able to login. However, their information will be
                            preserved for display purposes, and their group memberships and role assignments will be
                            preserved in case they are reactivated at a later time.
                        </p>}
                        {activate && <p>
                            Reactivated users will be able to login normally, and all their previous group memberships
                            and role assignments will apply.
                        </p>}
                        <p>
                            {Utils.pluralBasic(userCount, 'user')} will be updated. Do you want to proceed?
                        </p>
                    </>
                }
                onConfirm={() => onConfirm(activate)}
                onCancel={onCancel}
                confirmVariant={activate ? 'success' : 'danger'}
                confirmButtonText={'Yes, ' + action}
                cancelButtonText={'Cancel'}
            />
        )
    }
}
