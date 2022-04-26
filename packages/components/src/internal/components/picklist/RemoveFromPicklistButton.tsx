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

import { userCanManagePicklists } from '../../app/utils';

import { removeSamplesFromPicklist } from './actions';
import { Picklist } from './models';
import { DisableableButton } from '../buttons/DisableableButton';

interface Props {
    user: User;
    picklist: Picklist;
    model: QueryModel;
    afterSampleActionComplete: () => void;
}

export const RemoveFromPicklistButton: FC<Props> = memo(props => {
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
