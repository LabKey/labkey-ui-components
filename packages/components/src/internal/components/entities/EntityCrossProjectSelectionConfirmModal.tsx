import React, { FC, memo } from 'react';
import { ConfirmModal } from "../base/ConfirmModal";
import { capitalizeFirstChar } from "../../util/utils";

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

export function getCrossFolderSelectionMsg(crossFolderSelectionCount: number, currentFolderSelectionCount: number, noun: string, nounPlural: string): string {
    let first = '';
    if (currentFolderSelectionCount === 0) {
        if (crossFolderSelectionCount === 1)
            first = `The ${noun} you selected does not `;
        else
            first = `The ${nounPlural} you selected don't `;
    }
    else
        first = `Some of the ${nounPlural} you selected don't `;
    first += 'belong to this project.';
    const second = ` Please select ${nounPlural} from only this project, or navigate to the appropriate project to work with them.`;
    return first + second;
}
