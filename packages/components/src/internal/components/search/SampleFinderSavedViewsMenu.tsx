import React, { FC, memo, useState, useEffect, useMemo } from 'react';
import { Button, DropdownButton, MenuItem } from 'react-bootstrap';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { SubMenuItem } from '../menus/SubMenuItem';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { FinderReport } from './models';

interface Props {
    api?: ComponentsAPIWrapper;
    loadSearch: (view: FinderReport) => any;
    saveSearch: (saveCurrentName?: boolean) => any;
    manageSearches: () => any;
    currentView?: FinderReport;
    hasUnsavedChanges?: boolean;
    sessionViewName?: string;
    key: any;
}

export const SampleFinderSavedViewsMenu: FC<Props> = memo(props => {
    const { api, loadSearch, manageSearches, saveSearch, currentView, hasUnsavedChanges, sessionViewName, key } = props;

    const [savedSearches, setSavedSearches] = useState<FinderReport[]>(undefined);

    useEffect(() => {
        (async () => {
            const views = await api.samples.loadFinderSearches();
            setSavedSearches(views);
        })();
    }, [key]);

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
                        <SubMenuItem text="MOST RECENT SEARCH" inline>
                            <MenuItem onClick={() => loadSearch({ isSession: true, reportName: sessionViewName })}>
                                {sessionViewName}
                            </MenuItem>
                        </SubMenuItem>
                        <MenuItem divider />
                    </>
                )}
                {!savedSearches && <LoadingSpinner />}
                {savedSearches?.length > 0 && (
                    <>
                        {savedSearches.map(savedSearch => {
                            return (
                                <MenuItem onClick={() => loadSearch(savedSearch)}>{savedSearch.reportName}</MenuItem>
                            );
                        })}
                    </>
                )}
                {savedSearches?.length === 0 && <SubMenuItem text="NO SAVED SEARCH" inline />}
                <MenuItem divider />
                <MenuItem onClick={manageSearches} disabled={!hasSavedView}>
                    Manage saved searches
                </MenuItem>
                <MenuItem onClick={() => saveSearch(false)} disabled={!currentView && !hasUnsavedChanges}>
                    Save as custom search
                </MenuItem>
            </DropdownButton>
            {hasUnsavedChanges && currentView?.reportId && (
                <>
                    <DropdownButton id="save-finderview-dropdown" title="Save Search" bsStyle="success">
                        <MenuItem onClick={() => saveSearch(true)}>Save this search</MenuItem>
                        <MenuItem onClick={() => saveSearch(false)}>Save as a new search</MenuItem>
                    </DropdownButton>
                </>
            )}
            {hasUnsavedChanges && currentView && !currentView.reportId && (
                <Button bsStyle="success" onClick={() => saveSearch(false)} className="margin-left">
                    Save Search
                </Button>
            )}
        </>
    );
});

SampleFinderSavedViewsMenu.defaultProps = {
    api: getDefaultAPIWrapper(),
};
