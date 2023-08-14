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
import React, { PureComponent } from 'react';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { setSnapshotSelections } from '../../actions';

import { ConfirmModal } from '../base/ConfirmModal';
import { capitalizeFirstChar } from '../../util/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';

import { getDeleteConfirmationData } from './actions';
import { EntityDeleteConfirmHandler, EntityDeleteConfirmModalDisplay } from './EntityDeleteConfirmModalDisplay';
import { EntityDataType, OperationConfirmationData } from './models';

interface Props {
    entityDataType: EntityDataType;
    fetchDeleteConfirmationData?: (
        dataType: EntityDataType,
        rowIds: string[] | number[],
        selectionKey?: string,
        useSnapshotSelection?: boolean
    ) => Promise<OperationConfirmationData>
    getDeletionDescription?: (numToDelete: number) => React.ReactNode;
    model?: QueryModel;
    onCancel: () => void;
    onConfirm: EntityDeleteConfirmHandler;
    rowIds?: string[];
    selectionKey?: string;
    verb?: string;
}

interface State {
    confirmationData: OperationConfirmationData;
    error: string;
    isLoading: boolean;
}

/**
 * The higher-order component that wraps DeleteConfirmModalDisplay or displays a loading modal or error modal.
 */
export class EntityDeleteConfirmModal extends PureComponent<Props, State> {
    // This is used because a user may cancel during the loading phase, in which case we don't want to update state
    private _mounted: boolean;

    static defaultProps = {
        fetchDeleteConfirmationData: getDeleteConfirmationData,
    };

    constructor(props: Props) {
        super(props);

        if (props.rowIds === undefined && props.selectionKey === undefined) {
            throw new Error('Either rowIds or selectionKey must be provided in order to confirm deletion.');
        }

        this.state = {
            confirmationData: undefined,
            error: undefined,
            isLoading: true,
        };
    }

    componentDidMount(): void {
        this._mounted = true;
        this.init();
    }

    componentWillUnmount(): void {
        this._mounted = false;
    }

    init = async (): Promise<void> => {
        const { entityDataType, fetchDeleteConfirmationData, rowIds, selectionKey, model } = this.props;

        try {
            const useSnapshotSelection = model?.filterArray.length > 0;
            if (useSnapshotSelection) await setSnapshotSelections(selectionKey, [...model.selections]);
            const confirmationData = await fetchDeleteConfirmationData(
                entityDataType,
                rowIds,
                selectionKey,
                useSnapshotSelection
            );
            if (this._mounted) {
                this.setState({ confirmationData, isLoading: false });
            }
        } catch (e) {
            console.error('There was a problem retrieving the delete confirmation data.', e);
            if (this._mounted) {
                this.setState({
                    error: 'There was a problem retrieving the delete confirmation data.',
                    isLoading: false,
                });
            }
        }
    };

    render() {
        const { onConfirm, onCancel, entityDataType, getDeletionDescription } = this.props;

        if (this.state.isLoading) {
            return (
                <ConfirmModal
                    title={'Delete ' + capitalizeFirstChar(entityDataType.nounPlural)}
                    onCancel={onCancel}
                    cancelButtonText="Cancel"
                >
                    <LoadingSpinner msg="Loading confirmation data..." />
                </ConfirmModal>
            );
        }

        if (this.state.error) {
            return (
                <ConfirmModal
                    title="Deletion Error"
                    onCancel={onCancel}
                    onConfirm={undefined}
                    cancelButtonText="Dismiss"
                >
                    <Alert>{this.state.error}</Alert>
                </ConfirmModal>
            );
        }

        return (
            <EntityDeleteConfirmModalDisplay
                confirmationData={this.state.confirmationData}
                onConfirm={onConfirm}
                onCancel={onCancel}
                verb={this.props.verb}
                entityDataType={entityDataType}
                getDeletionDescription={getDeletionDescription}
            />
        );
    }
}
