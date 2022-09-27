import { useCallback, useMemo, useState } from 'react';
import { List } from 'immutable';

import { FolderMenuGlobalContext, ITab, NavigationGlobalContext, SubNavGlobalContext } from './types';

/**
 * Configures navigation context for the global state context.
 * NK: The reason this is declared in a separate file from hook.ts is to avoid circular dependencies.
 */
export const useNavigationContextState = (): NavigationGlobalContext => {
    // FolderMenuGlobalContext
    const [key, setKey] = useState<number>(0);
    const reload = useCallback(() => {
        setKey(key_ => (key_ + 1) % 2);
    }, []);
    const folderMenuContext = useMemo<FolderMenuGlobalContext>(
        () => ({
            key,
            reload,
        }),
        [key, reload]
    );

    // SubNavGlobalContext
    const [noun, setNoun] = useState<ITab>(undefined);
    const [tabs, setTabs] = useState<List<ITab>>(List());
    const [ignoreShow, setIgnoreShow] = useState<boolean>(false);
    const clearNav = useCallback(() => {
        setNoun(undefined);
        setTabs(List());
        setIgnoreShow(false);
    }, []);
    const subNavContext = useMemo<SubNavGlobalContext>(
        () => ({ clearNav, ignoreShow, noun, setIgnoreShow, setNoun, setTabs, tabs }),
        [clearNav, ignoreShow, noun, tabs]
    );

    return useMemo(
        () => ({
            folderMenu: folderMenuContext,
            subNav: subNavContext,
        }),
        [folderMenuContext, subNavContext]
    );
};
