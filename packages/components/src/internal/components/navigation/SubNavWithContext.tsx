import React, { createContext, FC, memo, useCallback, useContext, useMemo, useState } from 'react';
import { List } from 'immutable';

import { ITab, SubNav } from './SubNav';

export interface SubNavState {
    clearNav: () => void;
    noun: ITab;
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
    const clearNav = useCallback(() => {
        setNoun(undefined);
        setTabs(List());
    }, []);
    const subNavContext = useMemo<SubNavState>(
        () => ({ clearNav, noun, setNoun, setTabs, tabs }),
        [clearNav, noun, tabs]
    );

    return <SubNavContext.Provider value={subNavContext}>{children}</SubNavContext.Provider>;
});

/**
 * SubNavWithContext renders a SubNav component using data stored in the SubNavContext, this component is useful when
 * you need to update the SubNav based on data you load asynchronously after the page loads.
 */
export const SubNavWithContext: FC<SubNavState> = memo(() => {
    const { noun, tabs } = useSubNavContext();

    if (tabs.size === 0 && noun === undefined) {
        return null;
    }

    return <SubNav tabs={tabs} noun={noun} />;
});
