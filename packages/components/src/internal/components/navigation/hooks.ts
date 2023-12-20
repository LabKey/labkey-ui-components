import { useGlobalStateContext } from '../../GlobalStateContext';

import { FolderMenuGlobalContext, SubNavGlobalContext } from './types';

export const useFolderMenuContext = (): FolderMenuGlobalContext => {
    return useGlobalStateContext().navigation.folderMenu;
};

export const useSubNavTabsContext = (): SubNavGlobalContext => {
    return useGlobalStateContext().navigation.subNav;
};
