import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';

import { DEFAULT_ISSUES_DESIGNER_SETTINGS } from '../test/data/constants';
import './stories.scss';
import { IssuesDesignerPanels } from '../components/domainproperties/issues/IssuesDesignerPanels';
import { IssuesModel } from '../components/domainproperties/issues/models';
import { getCoreGroups } from '../components/permissions/actions';

import { List } from 'immutable';

import { Principal } from '..';

class WrappedNew extends React.Component<any, any> {
    constructor(props) {
        super(props);

        const model = IssuesModel.create(null, this.props.data);
        this.state = { model };
    }

    onRadioChange = e => {
        console.log('onRadioChange', e.target.name, e.target.value);
    };

    componentDidMount() {
        getCoreGroups()
            .then((principals: List<Principal>) => {
                this.setState(() => ({
                    coreGroups: principals,
                }));
            })
            .catch(response => {
                this.setState(() => ({ error: response.message }));
            });
    }
    render() {
        return (
            <IssuesDesignerPanels
                initModel={this.state.model}
                onCancel={() => console.log('cancel')}
                onComplete={() => console.log('onComplete')}
            />
        );
    }
}

storiesOf('IssuesDesignerPanels', module)
    .addDecorator(withKnobs)
    .add('IssuesDesignerPanels - create', () => {
        return <WrappedNew data={DEFAULT_ISSUES_DESIGNER_SETTINGS} />;
    });
