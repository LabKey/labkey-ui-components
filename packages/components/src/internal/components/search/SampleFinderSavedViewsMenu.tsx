import React, { FC, memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Button, DropdownButton, MenuItem } from 'react-bootstrap';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { useAppContext } from '../../AppContext';

import { FinderReport } from './models';

interface Props {
    loadSearch: (view: FinderReport) => void;
    saveSearch: (saveCurrentName?: boolean) => void;
    manageSearches: () => void;
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

    const onLoadSavedSearch = useCallback(
        e => {
            const view = savedSearches.find(search => search.reportId === e.target.name);
            loadSearch(view);
        },
        [savedSearches]
    );

    const onLoadSessionSearch = useCallback(() => {
        loadSearch({ isSession: true, reportName: sessionViewName });
    }, [sessionViewName]);

    const onSaveCurrentView = useCallback(e => {
        saveSearch(true);
    }, []);

    const onSaveNewView = useCallback(e => {
        saveSearch(false);
    }, []);

    return (
        <>
            <DropdownButton id="samplefinder-savedsearch-menu" title={menuTitle} className="button-right-spacing">
                {sessionViewName && (
                    <>
                        <MenuItem header>Most Recent Search</MenuItem>
                        <MenuItem onClick={onLoadSessionSearch}>{sessionViewName}</MenuItem>

                        <MenuItem divider />
                    </>
                )}
                {!savedSearches && <LoadingSpinner />}
                {savedSearches?.length > 0 && (
                    <>
                        {savedSearches.map((savedSearch, ind) => {
                            return (
                                <MenuItem key={ind} onClick={onLoadSavedSearch} name={savedSearch.reportId}>
                                    {savedSearch.reportName}
                                </MenuItem>
                            );
                        })}
                    </>
                )}
                {savedSearches?.length === 0 && <MenuItem header>No Saved Search</MenuItem>}
                <MenuItem divider />
                <MenuItem onClick={manageSearches} disabled={!hasSavedView}>
                    Manage saved searches
                </MenuItem>
                <MenuItem onClick={onSaveNewView} disabled={!currentView && !hasUnsavedChanges}>
                    Save as custom search
                </MenuItem>
            </DropdownButton>
            {hasUnsavedChanges && currentView?.reportId && (
                <DropdownButton id="save-finderview-dropdown" title="Save Search" bsStyle="success">
                    <MenuItem onClick={onSaveCurrentView}>Save this search</MenuItem>
                    <MenuItem onClick={onSaveNewView}>Save as a new search</MenuItem>
                </DropdownButton>
            )}
            {hasUnsavedChanges && currentView && !currentView.reportId && (
                <Button bsStyle="success" onClick={onSaveNewView} className="margin-left">
                    Save Search
                </Button>
            )}
        </>
    );
});
