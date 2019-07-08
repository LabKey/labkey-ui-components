/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
                msg={
                    <span>
                        {msgPrefix} {dependencies} will be permanently deleted.&nbsp;
                        <strong>Deletion cannot be undone.</strong>&nbsp;
                        Do you want to proceed?
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