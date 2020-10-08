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
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';

import { Panel } from 'react-bootstrap';

import { getStateQueryGridModel } from '..';
import { gridInit } from '..';
import { DetailEditing } from '..';
import { getQueryGridModel } from '..';
import './stories.scss';
import { LoadingSpinner } from '..';
import { SCHEMAS } from '..';
import { QueryGridModel, SchemaQuery } from '..';

interface Props {
    canUpdate: boolean;
    asSubPanel?: boolean;
    withSibling?: boolean;
    title?: string;
    cancelText?: string;
    submitText?: string;
    onEditToggle?: (editing: boolean) => any;
}

function onEditToggle(isEditing) {
    console.log('Editing state updated to ' + isEditing);
}

class DetailEditingPage extends React.Component<Props, any> {
    UNSAFE_componentWillMount(): void {
        this.initModel();
    }

    initModel() {
        const sampleModel = this.getQueryGridModel();
        gridInit(sampleModel, true, this);
    }

    getQueryGridModel(): QueryGridModel {
        const model = getStateQueryGridModel(
            'detailediting',
            SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'Samples'),
            {},
            123
        );
        return getQueryGridModel(model.getId()) || model;
    }

    onUpdate = () => {
        alert('Note: we did not actually save anything to the server (there is no server).');
    };

    render() {
        const { canUpdate, asSubPanel, title, cancelText, submitText, onEditToggle } = this.props;
        const model = this.getQueryGridModel();
        if (!model.isLoaded) {
            return <LoadingSpinner />;
        }

        return (
            <>
                <DetailEditing
                    queryModel={model}
                    canUpdate={canUpdate}
                    asSubPanel={asSubPanel}
                    title={title}
                    cancelText={cancelText}
                    submitText={submitText}
                    onUpdate={this.onUpdate}
                    useEditIcon={false}
                    onEditToggle={onEditToggle}
                />
                {this.props.withSibling && (
                    <Panel>
                        <Panel.Heading>Sibling Panel</Panel.Heading>
                        <Panel.Body>Don't tread on me.</Panel.Body>
                    </Panel>
                )}
            </>
        );
    }
}

storiesOf('DetailEditing', module)
    .addDecorator(withKnobs)
    .add('readonly', () => {
        return <DetailEditingPage canUpdate={false} />;
    })
    .add('editable', () => {
        return (
            <DetailEditingPage
                canUpdate={true}
                asSubPanel={boolean('As sub panel?', true)}
                onEditToggle={boolean('Use onEditToggle (check console log)?', true) ? onEditToggle : null}
                title={text('Title', 'Details')}
                submitText={text('Submit Text', 'Save')}
                cancelText={text('Cancel Text', 'Cancel')}
                withSibling={boolean('With sibling', false)}
            />
        );
    });
