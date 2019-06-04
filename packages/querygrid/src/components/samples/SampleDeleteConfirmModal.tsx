import * as React from 'react'
import { Map } from 'immutable'
import { buildURL, ConfirmModal } from "@glass/base";

interface Props {
    numSamples: number
    onConfirm: () => any
    onCancel: () => any
    showDependenciesLink: boolean
    rowId?: string
    selectionKey?: string
}

export class SampleDeleteConfirmModal extends React.Component<Props, any> {

    static defaultProps = {
        showDependenciesLink: false
    };

    render() {
        const { numSamples, onConfirm, onCancel, showDependenciesLink, rowId, selectionKey } = this.props;
        const msgPrefix = numSamples === 1 ? 'The sample and its' : 'All ' + numSamples + ' samples and their';

        let dependencies = <>dependencies</>;
        if (showDependenciesLink) {
            let params = Map<string, string>();
            if (rowId) {
                params = params.set('singleObjectRowId', rowId);
            }
            if (selectionKey) {
                params = params.set('dataRegionSelectionKey', selectionKey);
            }
            dependencies = <a href={buildURL('experiment', 'deleteMaterialByRowId', params.toJS())}>dependencies</a>;
        }

        return (
            <ConfirmModal
                title={'Permanently delete ' + numSamples + ' sample' + (numSamples === 1 ? '' : 's') + '?'}
                msg={<span>{msgPrefix} {dependencies} will be permanently deleted. <strong>Deletion cannot be undone.</strong></span>}
                onConfirm={onConfirm}
                onCancel={onCancel}
                confirmVariant='danger'
                confirmButtonText='Yes, Delete'
                cancelButtonText='Cancel'
            />
        )
    }
}