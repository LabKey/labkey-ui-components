import React from 'react';
import { List } from 'immutable';

import { ITab } from '../navigation/types';
import { SubNav } from '../navigation/SubNav';
import { AppURL } from '../../url/AppURL';

const PARENT_TAB: ITab = {
    text: 'Imports',
    url: AppURL.create('pipeline'),
};

interface Props {
    params?: any;
}

export class PipelineSubNav extends React.Component<Props, any> {
    generateTabs(): List<ITab> {
        const { id } = this.props.params;

        const tabs = List<ITab>().asMutable();
        tabs.push({
            text: 'Status',
            url: AppURL.create('pipeline', id),
        });

        return tabs;
    }

    render() {
        return <SubNav tabs={this.generateTabs()} noun={PARENT_TAB} />;
    }
}
