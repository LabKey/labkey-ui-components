import { ReactNode } from 'react';
import { List } from 'immutable';

import { AppURL } from '../../url/AppURL';

export interface ITab {
    onClick?: () => void;
    text: string;
    tooltip?: ReactNode;
    url?: string | AppURL;
}

export interface SubNavGlobalContext {
    clearNav: () => void;
    noun: ITab;
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
