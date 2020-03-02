import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, withKnobs } from '@storybook/addon-knobs';
import {ListDesignerPanels} from '../components/domainproperties/list/ListDesignerPanels';
import {ListModel} from "../components/domainproperties/list/models";
import getDomainDetailsJSON from '../test/data/property-getDomainDetails.json';

import './stories.scss';

const DEFAULT_LIST_SETTINGS = {
    "listId" : 0,
    "name" : null,
    "domainId" : 0,
    "keyName" : null,
    "keyType" : null,
    "titleColumn" : null,
    "description" : null,
    "lastIndexed" : null,
    "allowDelete" : true,
    "allowUpload" : true,
    "allowExport" : true,
    "discussionSetting" : 0,
    "entireListTitleTemplate" : "",
    "entireListIndexSetting" : 0,
    "entireListBodySetting" : 0,
    "eachItemTitleTemplate" : "",
    "eachItemBodySetting" : 0,
    "entireListIndex" : false,
    "entireListBodyTemplate" : null,
    "eachItemIndex" : false,
    "eachItemBodyTemplate" : null,
    "fileAttachmentIndex" : false
};

class Wrapped extends React.Component<any, any> {
    constructor(props) {
        super(props);

        let model = ListModel.create(this.props.data);
        this.state = {model};
    }

    onRadioChange = (e) => {
        console.log("onRadioChange", e.target.name, e.target.value);
    };


    render() {
        return(
            <ListDesignerPanels
                initModel={this.state.model}
                onCancel={() => console.log('cancel')}
                onComplete={() => console.log('onComplete')}
            />
        );
    }
}

class WrappedNew extends React.Component<any, any> {
    constructor(props) {
        super(props);

        let model = ListModel.create(null, this.props.data);
        this.state = {model};
    }

    onRadioChange = (e) => {
        console.log("onRadioChange", e.target.name, e.target.value);
    };


    render() {
        return(
            <ListDesignerPanels
                initModel={this.state.model}
                onCancel={() => console.log('cancel')}
                onComplete={() => console.log('onComplete')}
            />
        );
    }
}

storiesOf("ListDesignerPanels", module)
    .addDecorator(withKnobs)
    .add("ListDesignerPanels - create", () => {
        return (
            <WrappedNew data={DEFAULT_LIST_SETTINGS}/>
        )
    })
    .add("ListDesignerPanels - update", () => {
        return (
            <Wrapped data={getDomainDetailsJSON}/>
        )
    });
;
