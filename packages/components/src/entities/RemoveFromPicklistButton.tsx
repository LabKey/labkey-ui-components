import React, { FC, memo, useCallback, useState } from 'react';
import { PermissionTypes, Utils } from '@labkey/api';

import { QueryModel } from '../public/QueryModel/QueryModel';
import { RequiresPermission } from '../internal/components/base/Permissions';
import { ConfirmModal } from '../internal/components/base/ConfirmModal';
import { SampleTypeDataType } from '../internal/components/entities/constants';
import { getConfirmDeleteMessage } from '../internal/util/messaging';
import { User } from '../internal/components/base/models/User';

import { userCanManagePicklists } from '../internal/app/utils';

import { DisableableButton } from '../internal/components/buttons/DisableableButton';

import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';

import { removeSamplesFromPicklist } from '../internal/components/picklist/actions';
import { Picklist } from '../internal/components/picklist/models';

interface Props {
    afterSampleActionComplete: () => void;
    model: QueryModel;
    picklist: Picklist;
    user: User;
}

export const RemoveFromPicklistButton: FC<Props> = memo(props => {
    const { picklist, model, afterSampleActionComplete, user } = props;
    const [showRemoveFromPicklistConfirm, setShowRemoveFromPicklistConfirm] = useState<boolean>();
    const { createNotification } = useNotificationsContext();

    const onRemoveFromPicklist = useCallback(() => {
        if (model.hasSelections) {
            setShowRemoveFromPicklistConfirm(true);
        }
    }, [model]);

    const onHideRemoveFromList = useCallback(() => {
        setShowRemoveFromPicklistConfirm(false);
    }, []);

    const onRemoveFromList = useCallback(async () => {
        if (model?.hasSelections) {
            const numDeleted = await removeSamplesFromPicklist(picklist, model);
            afterSampleActionComplete();
            onHideRemoveFromList();

            createNotification(
                'Successfully removed ' + Utils.pluralize(numDeleted, 'sample', 'samples') + ' from this list.',
                true
            );
        }
    }, [model, picklist, afterSampleActionComplete, onHideRemoveFromList, createNotification]);

    if (!userCanManagePicklists(user)) {
        return null;
    }

    const nounAndNumber = model?.selections ? Utils.pluralize(model.selections.size, 'Sample', 'Samples') : undefined;
    const selectedNounAndNumber = model?.selections
        ? Utils.pluralize(model.selections.size, 'selected sample', 'selected samples')
        : undefined;

    return (
        <RequiresPermission perms={PermissionTypes.ManagePicklists}>
            {picklist.canRemoveItems(user) && (
                <DisableableButton
                    bsStyle="default"
                    onClick={onRemoveFromPicklist}
                    disabledMsg={
                        !model.hasSelections ? 'Select one or more ' + SampleTypeDataType.nounPlural + '.' : undefined
                    }
                >
                    Remove from Picklist
                </DisableableButton>
            )}
            {showRemoveFromPicklistConfirm && (
                <ConfirmModal
                    title="Remove from Picklist"
                    onConfirm={onRemoveFromList}
                    onCancel={onHideRemoveFromList}
                    confirmVariant="danger"
                    confirmButtonText={'Yes, Remove ' + nounAndNumber}
                    cancelButtonText="Cancel"
                >
                    Permanently remove the {selectedNounAndNumber} from this list?
                    {getConfirmDeleteMessage('Removal')}
                </ConfirmModal>
            )}
        </RequiresPermission>
    );
});
