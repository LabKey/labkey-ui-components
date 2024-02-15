import { useEffect } from 'react';

import { useSubNavTabsContext } from '../navigation/hooks';

import { ITab } from '../navigation/types';
import { AppURL } from '../../url/AppURL';

const PARENT_TAB: ITab = {
    text: 'Dashboard',
    url: AppURL.create('home'),
};

export const useAccountSubNav = (): void => {
    const { clearNav, setNoun, setTabs } = useSubNavTabsContext();
    useEffect(() => {
        setNoun(PARENT_TAB);
        setTabs([
            { text: 'Profile', url: AppURL.create('account', 'profile') },
            { text: 'Settings', url: AppURL.create('account', 'settings') },
        ]);
        return clearNav;
    }, [clearNav, setNoun, setTabs]);
};
