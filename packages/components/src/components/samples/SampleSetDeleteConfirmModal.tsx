import React from 'react'
import { Map } from 'immutable'
import { ConfirmModal } from '../base/ConfirmModal';
import { buildURL } from '../../url/ActionURL';

interface Props {
    onConfirm: () => any
    onCancel: () => any
    showDependenciesLink: boolean
    rowId: number
}

export class SampleSetDeleteConfirmModal extends React.Component<Props, any> {

    static defaultProps = {
        showDependenciesLink: false
    };

    render() {
        const { onConfirm, onCancel, showDependenciesLink, rowId } = this.props;

        let dependencies = <>dependencies</>;
        if (showDependenciesLink) {
            let params = Map<string, string>();
            params = params.set('singleObjectRowId', rowId.toString());
            dependencies = <a href={buildURL('experiment', 'deleteMaterialSource', params.toJS())}>dependencies</a>;
        }

        return (
            <ConfirmModal
                title={'Permanently delete sample set?'}
                msg={
                    <span>
                        The sample set and all of its {dependencies} will be permanently deleted.&nbsp;
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
