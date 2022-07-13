import React, { FC, memo, useState, useEffect, useMemo, useCallback } from 'react';
import {Button, DropdownButton, MenuItem, SplitButton} from 'react-bootstrap';

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
        if (!currentView) return 'Saved Searches';
        return (
            <>
                {(hasUnsavedChanges && currentView.reportId) && <span className="alert-info view-edit-alert">Edited</span>}
                {currentView.reportName}
            </>
        );
    }, [currentView, hasUnsavedChanges]);

    const hasViews = useMemo(() => {
        return savedSearches?.length > 0 || !!sessionViewName;
    }, [savedSearches, sessionViewName]);

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
            <DropdownButton id="samplefinder-savedsearch-menu" title={menuTitle} className="button-right-spacing" disabled={!hasViews}>
                {sessionViewName && (
                    <>
                        <MenuItem header>Most Recent Search</MenuItem>
                        <MenuItem active={sessionViewName === currentView?.reportName} onClick={onLoadSessionSearch}>{sessionViewName}</MenuItem>
                        <MenuItem divider />
                    </>
                )}
                {!savedSearches && <LoadingSpinner />}
                {savedSearches?.length > 0 && (
                    <>
                        {savedSearches.map((savedSearch, ind) => {
                            return (
                                <MenuItem key={ind} onClick={onLoadSavedSearch} name={savedSearch.reportId} active={savedSearch.reportId === currentView?.reportId} >
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
                <SplitButton id="save-finderview-dropdown" bsStyle="success" onClick={onSaveCurrentView} title="Save Search">
                    <MenuItem title="Save as a new search" onClick={onSaveNewView} key="saveNewGridView">
                    Save as ...
                    </MenuItem>
                </SplitButton>
            )}
            {hasUnsavedChanges && !currentView?.reportId && (
                <Button bsStyle="success" onClick={onSaveNewView} className="margin-left">
                    Save Search
                </Button>
            )}
        </>
    );
});
