import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';

import { ListDesignerPanels } from '../components/domainproperties/list/ListDesignerPanels';
import { ListModel } from '../components/domainproperties/list/models';
import getDomainDetailsJSON from '../test/data/list-getDomainDetails.json';
import { DEFAULT_LIST_SETTINGS } from '../test/data/constants';
import './stories.scss';

class Wrapped extends React.Component<any, any> {
    constructor(props) {
        super(props);

        const model = ListModel.create(this.props.data);
        this.state = { model };
    }

    onRadioChange = e => {
        console.log('onRadioChange', e.target.name, e.target.value);
    };

    render() {
        return (
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

        const model = ListModel.create(null, this.props.data);
        this.state = { model };
    }

    onRadioChange = e => {
        console.log('onRadioChange', e.target.name, e.target.value);
    };

    render() {
        return (
            <ListDesignerPanels
                initModel={this.state.model}
                onCancel={() => console.log('cancel')}
                onComplete={() => console.log('onComplete')}
            />
        );
    }
}

storiesOf('ListDesignerPanels', module)
    .addDecorator(withKnobs)
    .add('ListDesignerPanels - create', () => {
        return <WrappedNew data={DEFAULT_LIST_SETTINGS} />;
    })
    .add('ListDesignerPanels - update', () => {
        return <Wrapped data={getDomainDetailsJSON} />;
    });
