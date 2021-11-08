import React, { ComponentType, FC, memo, useCallback, useState } from 'react';
import { PermissionTypes, Utils } from '@labkey/api';

import { RequiresModelAndActions } from "../../../public/QueryModel/withQueryModels";
import { User } from "../base/models/User";
import { RequiresPermission } from "../base/Permissions";
import { ManageDropdownButton } from "../buttons/ManageDropdownButton";
import { SelectionMenuItem } from "../menus/SelectionMenuItem";
import { Picklist } from "./models";
import { SampleTypeDataType } from "../entities/constants";
import { removeSamplesFromPicklist } from "./actions";
import { createNotification } from "../notifications/actions";
import { ConfirmModal } from "../base/ConfirmModal";
import { getConfirmDeleteMessage } from "../../util/messaging";

interface GridButtonProps {
    user: User;
    AdditionalGridButtons?: ComponentType<RequiresModelAndActions>;
    picklist: Picklist;
    afterSampleActionComplete: () => void;
}

export const PicklistGridButtons: FC<GridButtonProps & RequiresModelAndActions> = memo(props => {
    const { AdditionalGridButtons, picklist, model, afterSampleActionComplete, user } = props;
    const [showRemoveFromPicklistConfirm, setShowRemoveFromPicklistConfirm] = useState<boolean>();

    const onRemoveFromPicklist = useCallback(() => {
        if (model.hasSelections) {
            setShowRemoveFromPicklistConfirm(true);
        }
    }, [model]);

    const onCancelRemoveFromList = useCallback(() => {
        setShowRemoveFromPicklistConfirm(false);
    }, []);

    const onRemoveFromList = useCallback(async () => {
        if (model?.hasSelections) {
            const numDeleted = await removeSamplesFromPicklist(picklist, model);
            createNotification(
                'Successfully removed ' + Utils.pluralize(numDeleted, 'sample', 'samples') + ' from this list.'
            );
            afterSampleActionComplete();
            onCancelRemoveFromList();
        }
    }, [model, picklist, afterSampleActionComplete, onCancelRemoveFromList]);

    if (!model || model.isLoading) {
        return null;
    }

    const nounAndNumber = model?.selections
        ? Utils.pluralize(model.selections.size, 'Sample', 'Samples')
        : undefined;
    const selectedNounAndNumber = model?.selections
        ? Utils.pluralize(model.selections.size, 'selected sample', 'selected samples')
        : undefined;

    return (
        <>
            {AdditionalGridButtons !== undefined && (
                <div className="btn-group gridbar-buttons">
                    <AdditionalGridButtons {...props}>
                        <RequiresPermission perms={PermissionTypes.Delete}>
                            <ManageDropdownButton id="picklist-samples">
                                {picklist.canRemoveItems(user) && (
                                    <SelectionMenuItem
                                        id="remove-samples-menu-item"
                                        text="Remove from Picklist"
                                        onClick={onRemoveFromPicklist}
                                        queryModel={model}
                                        nounPlural={SampleTypeDataType.nounPlural}
                                    />
                                )}
                            </ManageDropdownButton>
                        </RequiresPermission>
                    </AdditionalGridButtons>
                </div>
            )}
            {showRemoveFromPicklistConfirm && (
                <ConfirmModal
                    title="Remove from Picklist"
                    onConfirm={onRemoveFromList}
                    onCancel={onCancelRemoveFromList}
                    confirmVariant="danger"
                    confirmButtonText={'Yes, Remove ' + nounAndNumber}
                    cancelButtonText="Cancel"
                >
                    Permanently remove the {selectedNounAndNumber} from this list?
                    {getConfirmDeleteMessage('Removal')}
                </ConfirmModal>
            )}
        </>
    );
});
