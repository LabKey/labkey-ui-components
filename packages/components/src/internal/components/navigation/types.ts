import { ReactNode } from 'react';
import { List } from 'immutable';

import { AppURL } from '../../url/AppURL';

export interface ITab {
    text: string;
    tooltip?: ReactNode;
    url: string | AppURL;
}

export interface SubNavGlobalContext {
    clearNav: () => void;
    ignoreShow: boolean;
    noun: ITab;
    setIgnoreShow: (ignoreScrolled: boolean) => void;
    setNoun: (noun: ITab) => void;
    setTabs: (tabs: List<ITab>) => void;
    tabs: List<ITab>;
}

export interface FolderMenuGlobalContext {
    key: number;
    reload: () => void;
}

export interface NavigationGlobalContext {
    folderMenu: FolderMenuGlobalContext;
    subNav: SubNavGlobalContext;
}
