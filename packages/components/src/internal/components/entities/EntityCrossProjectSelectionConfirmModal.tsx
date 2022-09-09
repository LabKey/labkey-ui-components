import React, { FC, memo } from 'react';
import { ConfirmModal } from "../base/ConfirmModal";
import { capitalizeFirstChar } from "../../util/utils";
import {getCrossFolderSelectionMsg} from "./utils";

interface Props {
    crossFolderSelectionCount: number;
    currentFolderSelectionCount: number;
    verb?: string;
    noun?: string;
    nounPlural?: string;
    title?: string;
    onDismiss: () => void;
}

export const EntityCrossProjectSelectionConfirmModal: FC<Props> = memo(props => {
    const { onDismiss, verb = 'Edit ', title, noun = 'data', nounPlural = 'data', crossFolderSelectionCount, currentFolderSelectionCount } = props;

    if (crossFolderSelectionCount === 0)
        return null;

    return (
        <ConfirmModal
            cancelButtonText="Cancel"
            onCancel={onDismiss}
            title={title ?? `Cannot ${capitalizeFirstChar(verb)} ${capitalizeFirstChar(nounPlural)}`}
        >
            {getCrossFolderSelectionMsg(crossFolderSelectionCount, currentFolderSelectionCount, noun, nounPlural)}
        </ConfirmModal>
    )

});

