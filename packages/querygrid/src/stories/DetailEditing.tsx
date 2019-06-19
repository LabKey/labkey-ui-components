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
import * as React from 'react';
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { LoadingSpinner, QueryGridModel, SchemaQuery, SCHEMAS } from "@glass/base";

import { getStateQueryGridModel } from "../models";
import { gridInit } from "../actions";
import { DetailEditing } from "../components/forms/detail/DetailEditing";
import { getQueryGridModel } from "../global";
import './stories.scss'

interface Props {
    canUpdate: boolean
}

class DetailEditingPage extends React.Component<Props, any> {

    componentWillMount() {
        this.initModel();
    }

    initModel() {
        const sampleModel = this.getQueryGridModel();
        gridInit(sampleModel, true, this);
    }

    getQueryGridModel(): QueryGridModel {
        const model = getStateQueryGridModel('detailediting', SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'Samples'), {}, 123);
        return getQueryGridModel(model.getId()) || model;
    }

    onUpdate = () => {
        alert('Note: we did not actually save anything to the server (there is no server).');
    };

    render() {
        const model = this.getQueryGridModel();
        if (!model.isLoaded) {
            return <LoadingSpinner/>
        }

        return (
            <DetailEditing
                queryModel={model}
                canUpdate={this.props.canUpdate}
                onUpdate={this.onUpdate}
                useEditIcon={false}
            />
        )
    }
}

storiesOf('DetailEditing', module)
    .addDecorator(withKnobs)
    .add("readonly", () => {
        return (
            <DetailEditingPage canUpdate={false}/>
        )
    })
    .add("editable", () => {
        return (
            <DetailEditingPage canUpdate={true}/>
        )
    });