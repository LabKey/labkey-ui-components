/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, withKnobs } from '@storybook/addon-knobs';

import { AssayProtocolModel } from '../internal/components/domainproperties/assay/models';
import { AssayPropertiesPanel } from '../internal/components/domainproperties/assay/AssayPropertiesPanel';
import generalAssayTemplate from '../test/data/assay-getProtocolGeneralTemplate.json';
import generalAssaySaved from '../test/data/assay-getProtocolGeneral.json';
import elispotAssayTemplate from '../test/data/assay-getProtocolELISpotTemplate.json';
import elispotAssaySaved from '../test/data/assay-getProtocolELISpot.json';

import './stories.scss';

interface Props {
    data: {};
}

interface State {
    model: AssayProtocolModel;
}

class WrappedAssayPropertiesPanel extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            model: AssayProtocolModel.create(props.data),
        };
    }

    onAssayPropertiesChange = (model: AssayProtocolModel) => {
        this.setState(() => ({ model }));
    };

    render() {
        return (
            <AssayPropertiesPanel
                model={this.state.model}
                controlledCollapse={false}
                panelStatus="NONE"
                validate={false}
                useTheme={false}
                onChange={this.onAssayPropertiesChange}
                asPanel={boolean('asPanel', true)}
                appPropertiesOnly={boolean('appPropertiesOnly', false)}
                initCollapsed={boolean('initCollapsed', false)}
                collapsible={boolean('collapsible', true)}
            />
        );
    }
}

storiesOf('AssayPropertiesPanel', module)
    .addDecorator(withKnobs)
    .add('GPAT Template', () => {
        return <WrappedAssayPropertiesPanel data={generalAssayTemplate.data} />;
    })
    .add('GPAT Saved Assay', () => {
        return <WrappedAssayPropertiesPanel data={generalAssaySaved.data} />;
    })
    .add('ELISpot Template', () => {
        return <WrappedAssayPropertiesPanel data={elispotAssayTemplate.data} />;
    })
    .add('ELISpot Saved Assay', () => {
        return <WrappedAssayPropertiesPanel data={elispotAssaySaved.data} />;
    });
