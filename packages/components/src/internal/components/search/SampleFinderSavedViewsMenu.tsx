import React, { FC, memo, useState, useEffect, useMemo } from 'react';
import { Button, DropdownButton, MenuItem } from 'react-bootstrap';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { FinderReport } from './models';
import { useAppContext } from "../../AppContext";

interface Props {
    loadSearch: (view: FinderReport) => any;
    saveSearch: (saveCurrentName?: boolean) => any;
    manageSearches: () => any;
    currentView?: FinderReport;
    hasUnsavedChanges?: boolean;
    sessionViewName?: string;
}

export const SampleFinderSavedViewsMenu: FC<Props> = memo(props => {
    const { loadSearch, manageSearches, saveSearch, currentView, hasUnsavedChanges, sessionViewName } = props;

    const [savedSearches, setSavedSearches] = useState<FinderReport[]>(undefined);

    const { api } = useAppContext();

    useEffect(() => {
        (async () => {
            try {
                const views = await api.samples.loadFinderSearches();
                setSavedSearches(views);
            } catch (error) {
                // do nothing, already logged
            }
        })();
    }, []);

    const hasSavedView = savedSearches?.length > 0;

    const menuTitle = useMemo(() => {
        if (!currentView?.reportId) return 'Saved Searches';
        return (
            <>
                {hasUnsavedChanges && <span className="alert-info finder-view-edit-alert">EDITED</span>}
                {currentView.reportName}
            </>
        );
    }, [currentView, hasUnsavedChanges]);

    return (
        <>
            <DropdownButton id="samplefinder-savedsearch-menu" title={menuTitle} className="button-right-spacing">
                {sessionViewName && (
                    <>
                        <MenuItem className="submenu-header" header>Most Recent Search</MenuItem>
                            <MenuItem onClick={() => loadSearch({ isSession: true, reportName: sessionViewName })}>
                                {sessionViewName}
                            </MenuItem>

                        <MenuItem divider />
                    </>
                )}
                {!savedSearches && <LoadingSpinner />}
                {savedSearches?.length > 0 && (
                    <>
                        {savedSearches.map((savedSearch, ind) => {
                            return (
                                <MenuItem key={ind} onClick={() => loadSearch(savedSearch)}>{savedSearch.reportName}</MenuItem>
                            );
                        })}
                    </>
                )}
                {savedSearches?.length === 0 && <MenuItem className="submenu-header" header>No Saved Search</MenuItem>}
                <MenuItem divider />
                <MenuItem onClick={manageSearches} disabled={!hasSavedView}>
                    Manage saved searches
                </MenuItem>
                <MenuItem onClick={() => saveSearch(false)} disabled={!currentView && !hasUnsavedChanges}>
                    Save as custom search
                </MenuItem>
            </DropdownButton>
            {hasUnsavedChanges && currentView?.reportId && (
                <DropdownButton id="save-finderview-dropdown" title="Save Search" bsStyle="success">
                    <MenuItem onClick={() => saveSearch(true)}>Save this search</MenuItem>
                    <MenuItem onClick={() => saveSearch(false)}>Save as a new search</MenuItem>
                </DropdownButton>
            )}
            {hasUnsavedChanges && currentView && !currentView.reportId && (
                <Button bsStyle="success" onClick={() => saveSearch(false)} className="margin-left">
                    Save Search
                </Button>
            )}
        </>
    );
});
