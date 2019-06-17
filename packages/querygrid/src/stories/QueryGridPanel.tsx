import * as React from 'react';
import { storiesOf } from "@storybook/react";
import { withKnobs } from '@storybook/addon-knobs'
import { ManageDropdownButton, QueryGridModel, SchemaQuery, SelectionMenuItem } from "@glass/base";

import { QueryGridPanel } from "../components/QueryGridPanel";
import { getStateQueryGridModel } from "../models";
import './stories.scss'

class QueryGridPanelWrapper extends React.Component {
    renderButtons = (model: QueryGridModel) => {
        if (model) {
            return (
                <ManageDropdownButton id={'storymanagebtn'}>
                    <SelectionMenuItem
                        id={'storymenuitem'}
                        text={'Delete Samples'}
                        onClick={() => console.log('onMenuItemClick')}
                        model={model}
                    />
                </ManageDropdownButton>
            )
        }
    };

    getQueryGridModel() {
        const modelId = "gridPanelWithData";
        const schemaQuery = new SchemaQuery({
            schemaName: "exp.data",
            queryName: "mixtures"
        });

        return getStateQueryGridModel(modelId, schemaQuery, {});
    }

    render() {
        return <QueryGridPanel model={this.getQueryGridModel()} buttons={this.renderButtons} />;
    }
}

class QueryGridPanelWithMessagesWrapper extends React.Component {
    renderButtons = (model: QueryGridModel) => {
        if (model) {
            return (
                <ManageDropdownButton id={'storymanagebtn'}>
                    <SelectionMenuItem
                        id={'storymenuitem'}
                        text={'Delete Samples'}
                        onClick={() => console.log('onMenuItemClick')}
                        model={model}
                    />
                </ManageDropdownButton>
            )
        }
    };

    getQueryGridModel() {
        const modelId = "gridPanelWithMessages";
        const schemaQuery = new SchemaQuery({
            schemaName: "assay.General.Amino Acids",
            queryName: "Runs"
        });

        return getStateQueryGridModel(modelId, schemaQuery, {});
    }

    render() {
        return <QueryGridPanel model={this.getQueryGridModel()} buttons={this.renderButtons} />;
    }
}

storiesOf('QueryGridPanel', module)
    .addDecorator(withKnobs)
    .add("with data", () => {
        return <QueryGridPanelWrapper/>;
    })
    .add("with messages", () => {
        return <QueryGridPanelWithMessagesWrapper/>;
    });
