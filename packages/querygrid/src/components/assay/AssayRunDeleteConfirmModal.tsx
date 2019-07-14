import * as React from 'react'
import { ConfirmModal } from "@glass/base";

interface Props {
    onConfirm: () => any
    onCancel: () => any
    numToDelete: number,
}

export class AssayRunDeleteConfirmModal extends React.Component<Props, any> {

    render() {
        const { onConfirm, onCancel, numToDelete} = this.props;

        const noun = numToDelete === 1 ? " assay run" : " assay runs";

        return (
            <ConfirmModal
                title={"Permanently delete " + numToDelete  + noun + "?"}
                msg={
                    <span>
                        The selected {numToDelete > 1 ? numToDelete : ''} {noun} and all of {numToDelete === 1 ? 'its' : 'their'} data will be permanently deleted.&nbsp;
                        <p className={'top-spacing'}><strong>Deletion cannot be undone.</strong>&nbsp;
                            Do you want to proceed?</p>
                    </span>
                }
                onConfirm={onConfirm}
                onCancel={onCancel}
                confirmVariant='danger'
                confirmButtonText='Yes, Delete'
                cancelButtonText='Cancel'
            />
        )
    }
}