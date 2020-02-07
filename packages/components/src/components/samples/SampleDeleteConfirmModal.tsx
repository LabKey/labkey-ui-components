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
import React from 'react';
import { EntityDeleteConfirmModal } from '../lineage/EntityDeleteConfirmModal';
import { DELETE_SAMPLES_TOPIC } from '../../util/helpLinks';
import { LineageDataType } from '../lineage/models';

interface Props {
    onConfirm: (rowsToDelete: Array<any>, rowsToKeep: Array<any>) => any
    onCancel: () => any
    rowIds?: Array<string>
    selectionKey?: string
}

export class SampleDeleteConfirmModal extends React.Component<Props, any> {

    render() {
        return (
            <EntityDeleteConfirmModal
                {... this.props}
                lineageDataType={LineageDataType.Sample}
                nounSingular={"sample"}
                nounPlural={"samples"}
                dependencyText={"derived sample or assay data dependencies"}
                helpLinkTopic={DELETE_SAMPLES_TOPIC}
             />
        )
    }
}
