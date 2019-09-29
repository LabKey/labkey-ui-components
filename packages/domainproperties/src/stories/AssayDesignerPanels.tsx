/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react'
import { List } from 'immutable'
import { storiesOf } from '@storybook/react'
import { text, boolean, withKnobs } from '@storybook/addon-knobs'

import { AssayProtocolModel } from "../models";
import { AssayDesignerPanels } from "../components/assay/AssayDesignerPanels"
import { initMocks } from "./mock";
import generalAssayTemplate from "../test/data/assay-getProtocolGeneralTemplate.json";
import generalAssaySaved from "../test/data/assay-getProtocolGeneral.json";
import elispotAssayTemplate from "../test/data/assay-getProtocolELISpotTemplate.json";
import elispotAssaySaved from "../test/data/assay-getProtocolELISpot.json";
import './stories.scss'

initMocks();

interface Props {
    data: {}
}

interface State {
    model: AssayProtocolModel
}

class WrappedAssayDesignerPanels extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            model: AssayProtocolModel.create(props.data)
        }
    }

    onAssayPropertiesChange = (model: AssayProtocolModel) => {
        this.setState(() => ({model}));
    };

    render() {
        return (
            <AssayDesignerPanels
                initModel={this.state.model}
                hideEmptyBatchDomain={boolean('hideEmptyBatchDomain', false)}
                onChange={(model: AssayProtocolModel) => {
                    console.log('change', model.toJS());
                }}
                onComplete={(model: AssayProtocolModel) => {
                    console.log('complete clicked', model.toJS());
                }}
                onCancel={() => {
                    console.log('cancel clicked');
                }}
            />
        )
    }
}

storiesOf("AssayDesignerPanels", module)
    .addDecorator(withKnobs)
    .add("GPAT Template", () => {
        return (
            <WrappedAssayDesignerPanels data={generalAssayTemplate.data}/>
        )
    })
    .add("GPAT Saved Assay", () => {
        return (
            <WrappedAssayDesignerPanels data={generalAssaySaved.data}/>
        )
    })
    .add("ELISpot Template", () => {
        return (
            <WrappedAssayDesignerPanels data={elispotAssayTemplate.data}/>
        )
    })
    .add("ELISpot Saved Assay", () => {
        return (
            <WrappedAssayDesignerPanels data={elispotAssaySaved.data}/>
        )
    });