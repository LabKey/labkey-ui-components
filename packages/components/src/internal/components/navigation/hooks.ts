import { useGlobalStateContext } from '../../GlobalStateContext';

import { FolderMenuGlobalContext, SubNavGlobalContext } from './types';

export const useFolderMenuContext = (): FolderMenuGlobalContext => {
    return useGlobalStateContext().navigation.folderMenu;
};

export const useSubNavContext = (): SubNavGlobalContext => {
    return useGlobalStateContext().navigation.subNav;
};
