import React from 'reactn';
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { LoadingSpinner, QueryGridModel, SchemaQuery } from "@glass/base";

import { getStateQueryGridModel } from "../model";
import { gridInit } from "../actions";
import { DetailEditing } from "../components/forms/detail/DetailEditing";
import { SCHEMAS } from "../query/schemas";
import './stories.scss'
import { getQueryGridModel } from "../global";

interface Props {
    canUpdate: boolean
}

class DetailEditingPage extends React.Component<Props, any> {

    getQueryGridModel(): QueryGridModel {
        const model = getStateQueryGridModel('detailediting', SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'Samples'), {}, 123);
        gridInit(model, true, this);
        const stateModel = getQueryGridModel(model.getId()) || model;
        return stateModel;
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