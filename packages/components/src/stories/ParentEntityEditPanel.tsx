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

import { getStateQueryGridModel } from '..';
import { gridInit } from '..';
import { getQueryGridModel } from '..';
import './stories.scss';
import { LoadingSpinner } from '..';
import { SCHEMAS } from '..';
import { QueryGridModel, SchemaQuery } from '..';
import { DataClassDataType, ParentEntityEditPanel } from '..';

interface Props {
    canUpdate: boolean;
    title?: string;
    cancelText?: string;
    submitText?: string;
    childName: string;
    childNounSingular: string;
    multipleSources?: boolean;
}

class ParentEntityEditPage extends React.Component<Props, any> {
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
            SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, this.props.multipleSources ? 'multisource' : 'examples'),
            {},
            53412
        );
        return getQueryGridModel(model.getId()) || model;
    }

    onUpdate = () => {
        alert('Note: we did not actually save anything to the server (there is no server).');
    };

    render() {
        const { canUpdate, childName, childNounSingular, title } = this.props;
        const model = this.getQueryGridModel();
        if (!model.isLoaded) {
            return <LoadingSpinner />;
        }

        return (
            <ParentEntityEditPanel
                childModel={model}
                canUpdate={canUpdate}
                childName={childName}
                childNounSingular={childNounSingular}
                title={title}
                parentDataType={DataClassDataType}
            />
        );
    }
}

storiesOf('ParentEntityEditPanel', module)
    .addDecorator(withKnobs)
    .add('single source', () => {
        return (
            <ParentEntityEditPage
                canUpdate={boolean('Can update?', true)}
                childName={text('Child name', 'B-123')}
                childNounSingular={text('Child noun', 'Sample')}
                title={text('Title', 'Details')}
                submitText={text('Submit Text', 'Save')}
                cancelText={text('Cancel Text', 'Cancel')}
            />
        );
    })
    .add('multiple sources', () => {
        return (
            <ParentEntityEditPage
                canUpdate={boolean('Can update?', true)}
                childName={text('Child name', 'B-123')}
                childNounSingular={text('Child noun', 'Sample')}
                title={text('Title', 'Details')}
                submitText={text('Submit Text', 'Save')}
                cancelText={text('Cancel Text', 'Cancel')}
                multipleSources={true}
            />
        );
    });
