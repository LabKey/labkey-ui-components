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

import { ConfirmModal, LoadingSpinner, Alert } from '../../..';

import { EntityDeleteConfirmModalDisplay } from './EntityDeleteConfirmModalDisplay';
import { DeleteConfirmationData, getDeleteConfirmationData } from './actions';
import { EntityDataType } from './models';

interface Props {
    onConfirm: (rowsToDelete: any[], rowsToKeep: any[]) => any;
    onCancel: () => any;
    entityDataType: EntityDataType;
    rowIds?: string[];
    selectionKey?: string;
    verb?: string;
}

interface State {
    confirmationData: DeleteConfirmationData;
    error: string;
    isLoading: boolean;
}

/**
 * The higher-order component that wraps DeleteConfirmModalDisplay or displays a loading modal or error modal.
 */
export class EntityDeleteConfirmModal extends PureComponent<Props, State> {
    // This is used because a user may cancel during the loading phase, in which case we don't want to update state
    private _mounted: boolean;

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
        const { entityDataType, rowIds, selectionKey } = this.props;

        try {
            const confirmationData = await getDeleteConfirmationData(selectionKey, entityDataType, rowIds);
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
        const { onConfirm, onCancel, entityDataType } = this.props;

        if (this.state.isLoading) {
            return (
                <ConfirmModal
                    title="Loading confirmation data"
                    msg={<LoadingSpinner />}
                    onCancel={onCancel}
                    cancelButtonText="Cancel"
                />
            );
        }

        if (this.state.error) {
            return (
                <ConfirmModal
                    title="Deletion Error"
                    onCancel={onCancel}
                    msg={<Alert>{this.state.error}</Alert>}
                    onConfirm={undefined}
                    cancelButtonText="Dismiss"
                />
            );
        }

        return (
            <EntityDeleteConfirmModalDisplay
                confirmationData={this.state.confirmationData}
                onConfirm={onConfirm}
                onCancel={onCancel}
                verb={this.props.verb}
                entityDataType={entityDataType}
            />
        );
    }
}
