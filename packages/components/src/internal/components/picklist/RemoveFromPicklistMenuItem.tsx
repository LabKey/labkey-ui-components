import React, { FC, memo, useCallback, useState } from 'react';
import { PermissionTypes, Utils } from '@labkey/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { RequiresPermission } from '../base/Permissions';
import { ConfirmModal } from '../base/ConfirmModal';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';
import { SampleTypeDataType } from '../entities/constants';
import { getConfirmDeleteMessage } from '../../util/messaging';
import { createNotification, withTimeout } from '../notifications/actions';
import { User } from '../base/models/User';

import { isFreezerManagementEnabled, userCanManagePicklists } from '../../app/utils';

import { removeSamplesFromPicklist } from './actions';
import { Picklist } from './models';

interface Props {
    user: User;
    picklist: Picklist;
    model: QueryModel;
    afterSampleActionComplete: () => void;
}

export const RemoveFromPicklistMenuItem: FC<Props> = memo(props => {
    const { picklist, model, afterSampleActionComplete, user } = props;
    const [showRemoveFromPicklistConfirm, setShowRemoveFromPicklistConfirm] = useState<boolean>();

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

            withTimeout(() => {
                createNotification(
                    'Successfully removed ' + Utils.pluralize(numDeleted, 'sample', 'samples') + ' from this list.'
                );
            });
        }
    }, [model, picklist, afterSampleActionComplete, onHideRemoveFromList]);

    if (!userCanManagePicklists(user) || !isFreezerManagementEnabled()) {
        return null;
    }

    const nounAndNumber = model?.selections ? Utils.pluralize(model.selections.size, 'Sample', 'Samples') : undefined;
    const selectedNounAndNumber = model?.selections
        ? Utils.pluralize(model.selections.size, 'selected sample', 'selected samples')
        : undefined;

    return (
        <RequiresPermission perms={PermissionTypes.Delete}>
            {picklist.canRemoveItems(user) && (
                <SelectionMenuItem
                    id="remove-samples-menu-item"
                    text="Remove from Picklist"
                    onClick={onRemoveFromPicklist}
                    queryModel={model}
                    nounPlural={SampleTypeDataType.nounPlural}
                />
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
