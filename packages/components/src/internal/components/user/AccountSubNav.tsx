import React from 'react';
import { List } from 'immutable';

import { ITab } from '../navigation/types';
import { SubNav } from '../navigation/SubNav';
import { AppURL } from '../../url/AppURL';

const PARENT_TAB: ITab = {
    text: 'Dashboard',
    url: AppURL.create('home'),
};

const TABS = List<string>(['Profile', 'Settings']);

export class AccountSubNav extends React.Component<any, any> {
    generateTabs(): List<ITab> {
        return TABS.map(text => ({
            text,
            url: AppURL.create('account', text.toLowerCase()),
        })).toList();
    }

    render() {
        return <SubNav tabs={this.generateTabs()} noun={PARENT_TAB} />;
    }
}
