/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { AppURL } from '../../url/AppURL';

export interface ITab {
    isActive?: boolean;
    text: string;
    url?: string | AppURL;
}

export interface SubNavGlobalContext {
    clearNav: () => void;
    noun: ITab;
    setNoun: (noun: ITab) => void;
    setTabs: (tabs: ITab[]) => void;
    tabs: ITab[];
}

export interface FolderMenuGlobalContext {
    key: number;
    reload: () => void;
}

export interface NavigationGlobalContext {
    folderMenu: FolderMenuGlobalContext;
    subNav: SubNavGlobalContext;
}
