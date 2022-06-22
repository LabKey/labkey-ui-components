import React, { createContext, FC, memo, useCallback, useContext, useMemo, useState } from 'react';
import { List } from 'immutable';

import { ITab, SubNav } from './SubNav';

export interface SubNavState {
    clearNav: () => void;
    ignoreShow: boolean;
    noun: ITab;
    setIgnoreShow: (ignoreScrolled: boolean) => void;
    setNoun: (noun: ITab) => void;
    setTabs: (tabs: List<ITab>) => void;
    tabs: List<ITab>;
}

export const SubNavContext = createContext<SubNavState>(undefined);

export const useSubNavContext = (): SubNavState => {
    const context = useContext(SubNavContext);

    if (context === undefined) throw new Error('useSubNavContext must be used within a SubNavContext.Provider');

    return context;
};

export const SubNavContextProvider: FC = memo(({ children }) => {
    const [noun, setNoun] = useState<ITab>(undefined);
    const [tabs, setTabs] = useState<List<ITab>>(List());
    const [ignoreShow, setIgnoreShow] = useState<boolean>(false);
    const clearNav = useCallback(() => {
        setNoun(undefined);
        setTabs(List());
        setIgnoreShow(false);
    }, []);
    const subNavContext = useMemo<SubNavState>(
        () => ({ clearNav, ignoreShow, noun, setIgnoreShow, setNoun, setTabs, tabs }),
        [clearNav, ignoreShow, noun, tabs]
    );

    return <SubNavContext.Provider value={subNavContext}>{children}</SubNavContext.Provider>;
});

/**
 * SubNavWithContext renders a SubNav component using data stored in the SubNavContext, this component is useful when
 * you need to update the SubNav based on data you load asynchronously after the page loads.
 */
export const SubNavWithContext: FC<SubNavState> = memo(() => {
    const { ignoreShow, noun, tabs } = useSubNavContext();

    if (tabs.size === 0 && noun === undefined) {
        return null;
    }

    return <SubNav ignoreShow={ignoreShow} noun={noun} tabs={tabs} />;
});
