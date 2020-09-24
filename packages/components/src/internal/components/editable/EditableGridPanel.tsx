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
import ReactN from 'reactn';
import { Panel } from 'react-bootstrap';

import { gridInit } from '../../actions';

import { QueryGridModel } from '../base/models/model';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { EditableGrid, EditableGridProps } from './EditableGrid';

interface Props extends EditableGridProps {
    title?: string;
    bsStyle?: any;
    className?: string;
}

export class EditableGridPanel extends ReactN.Component<Props, any> {
    constructor(props: EditableGridProps) {
        // @ts-ignore // see https://github.com/CharlesStover/reactn/issues/126
        super(props);

        if (!props.model) {
            throw new Error('EditableGridPanel: a model must be provided.');
        }
    }

    componentDidMount() {
        this.initModel(this.props);
    }

    UNSAFE_componentWillReceiveProps(nextProps: Props): void {
        this.initModel(nextProps);
    }

    initModel(props: Props) {
        const { model } = props;

        // make sure each QueryGridModel is initialized
        if (model && !model.isLoaded && !model.isLoading) {
            gridInit(model, false);
        }
    }

    getModel(): QueryGridModel {
        const { model } = this.props;

        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.QueryGrid_models.get(model.getId());
    }

    render() {
        const { bsStyle, className, title } = this.props;
        const model = this.getModel();

        if (!model) {
            return <LoadingSpinner />;
        }

        if (!title) {
            return <EditableGrid {...this.props} />;
        }

        return (
            <Panel bsStyle={bsStyle} className={className}>
                <Panel.Heading>{title}</Panel.Heading>
                <Panel.Body className="table-responsive">
                    <EditableGrid {...this.props} />
                </Panel.Body>
            </Panel>
        );
    }
}
