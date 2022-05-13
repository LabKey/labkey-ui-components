import React, {FC, memo, useState, useEffect, useMemo} from 'react';
import { Button, DropdownButton, MenuItem } from 'react-bootstrap';

import { SubMenuItem } from "../menus/SubMenuItem";
import { loadFinderSearches } from "./actions";
import { FinderReport } from "./models";
import { getLocalStorageKey, searchFiltersFromJson } from "./utils";

interface Props {
    loadSearch: (view: FinderReport) => any
    saveSearch: (saveCurrentName?: boolean) => any
    manageSearches: () => any
    currentView?: FinderReport
    hasUnsavedChanges?: boolean
    key: any
}

export const SampleFinderSavedViewsMenu: FC<Props> = memo(props => {
    const { loadSearch, manageSearches, saveSearch, currentView, hasUnsavedChanges, key } = props;

    const [unsavedSessionViewName, setUnsavedSessionViewName] = useState<string>(undefined);
    const [savedSearches, setSavedSearches] = useState<FinderReport[]>([]);

    useEffect(() => {
        (async () => {
            const views = await loadFinderSearches();
            setSavedSearches(views);

            const finderSessionDataStr = sessionStorage.getItem(getLocalStorageKey());
            if (finderSessionDataStr) {
                const finderSessionData = searchFiltersFromJson(finderSessionDataStr);
                if (finderSessionData.filterTimestamp) {
                    setUnsavedSessionViewName(finderSessionData.filterTimestamp);
                }
            }
        })();

    }, [key]);

    const hasSavedView = savedSearches?.length > 0;

    const menuTitle = useMemo(() => {
        if (!currentView?.reportId)
            return "Saved Searches"
        return (
            <>
                {hasUnsavedChanges && <span className="alert-info finder-view-edit-alert">EDITED</span>}
                {currentView.reportName}
            </>
        )
    }, [currentView, hasUnsavedChanges])

    return (
        <>
            <DropdownButton id="samplefinder-savedsearch-menu" title={menuTitle} className={'button-right-spacing'}>
                {
                    unsavedSessionViewName &&
                    <>
                        <SubMenuItem text="MOST RECENT SEARCH" inline>
                            <MenuItem onClick={() => loadSearch({isSession: true, reportName: unsavedSessionViewName})}>{unsavedSessionViewName}</MenuItem>
                        </SubMenuItem>
                        <MenuItem divider />
                    </>
                }
                {
                    hasSavedView &&
                    <>
                        {savedSearches.map((savedSearch) => {
                            return (
                                <MenuItem onClick={() => loadSearch(savedSearch)}>{savedSearch.reportName}</MenuItem>
                            );
                        })}
                    </>
                }
                {
                    !hasSavedView &&
                    <SubMenuItem text="NO SAVED SEARCH" inline/>
                }
                <MenuItem divider />
                <MenuItem onClick={manageSearches} disabled={!hasSavedView}>Manage saved searches</MenuItem>
                <MenuItem onClick={() => saveSearch(false)} disabled={!currentView && !hasUnsavedChanges}>Save as custom search</MenuItem>
            </DropdownButton>
            {
                (hasUnsavedChanges && currentView?.reportId) &&
                <>
                    <DropdownButton id="save-finderview-dropdown" title="Save Search" bsStyle="success">
                        <MenuItem onClick={() => saveSearch(true)}>Save this search</MenuItem>
                        <MenuItem onClick={() => saveSearch(false)}>Save as a new search</MenuItem>
                    </DropdownButton>
                </>
            }
            {
                (hasUnsavedChanges && currentView && !currentView.reportId) &&
                <Button bsStyle="success" onClick={() => saveSearch(false)} className="margin-left">Save Search</Button>
            }
        </>

    );
});
