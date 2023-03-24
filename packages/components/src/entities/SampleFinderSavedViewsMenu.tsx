import React, { FC, memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Button, DropdownButton, MenuItem, SplitButton } from 'react-bootstrap';

import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';

import { useAppContext } from '../internal/AppContext';

import { FinderReport } from '../internal/components/search/models';

interface Props {
    currentView?: FinderReport;
    hasUnsavedChanges?: boolean;
    loadSearch: (view: FinderReport) => void;
    manageSearches: () => void;
    saveSearch: (saveCurrentName?: boolean) => void;
    sessionViewName?: string;
}

export const SampleFinderSavedViewsMenu: FC<Props> = memo(props => {
    const { loadSearch, manageSearches, saveSearch, currentView, hasUnsavedChanges, sessionViewName } = props;

    const [savedSearches, setSavedSearches] = useState<FinderReport[]>(undefined);
    const [moduleSearches, setModuleSearches] = useState<FinderReport[]>(undefined);
    const [open, setOpen] = useState<boolean>(false);

    const { api } = useAppContext();

    useEffect(() => {
        (async () => {
            try {
                const views = await api.samples.loadFinderSearches();
                const userViews = [];
                const moduleViews = [];
                views.forEach(view => {
                    if (view.isModuleReport) moduleViews.push(view);
                    else userViews.push(view);
                });
                setSavedSearches(userViews);
                setModuleSearches(moduleViews);
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
                {hasUnsavedChanges && currentView.reportId && (
                    <span className="alert-info view-edit-alert">Edited</span>
                )}
                {currentView.reportName}
            </>
        );
    }, [currentView, hasUnsavedChanges]);

    const hasViews = useMemo(() => {
        return savedSearches?.length > 0 || !!sessionViewName;
    }, [savedSearches, sessionViewName]);

    const onToggle = useCallback(() => {
        setOpen(_open => !_open);
    }, []);

    const onLoadSavedSearch = useCallback(
        e => {
            const view = savedSearches.find(search => search.reportId === e.target.name);
            loadSearch(view);
            onToggle();
        },
        [loadSearch, savedSearches, onToggle]
    );

    const onLoadModuleSearch = useCallback(
        e => {
            const view = moduleSearches.find(search => search.reportId === e.target.name);
            loadSearch(view);
        },
        [loadSearch, moduleSearches]
    );

    const onLoadSessionSearch = useCallback(() => {
        loadSearch({ isSession: true, reportName: sessionViewName });
        onToggle();
    }, [loadSearch, sessionViewName, onToggle]);

    const onSaveCurrentView = useCallback(() => {
        saveSearch(true);
    }, [saveSearch]);

    const onSaveNewView = useCallback(() => {
        if (!currentView && !hasUnsavedChanges) return;
        saveSearch(false);
    }, [currentView, hasUnsavedChanges, saveSearch]);

    const onManageView = useCallback(() => {
        if (!hasSavedView) return;
        manageSearches();
    }, [hasSavedView, manageSearches]);

    return (
        <>
            <DropdownButton
                id="samplefinder-savedsearch-menu"
                title={menuTitle}
                className="button-right-spacing"
                disabled={!hasViews}
                onToggle={onToggle}
                open={open}
            >
                {sessionViewName && (
                    <>
                        <MenuItem header>Most Recent Search</MenuItem>
                        <MenuItem
                            active={sessionViewName === currentView?.reportName}
                            onClick={onLoadSessionSearch}
                            className="session-finder-view"
                        >
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
                                <MenuItem
                                    key={ind}
                                    onClick={onLoadSavedSearch}
                                    name={savedSearch.reportId}
                                    active={savedSearch.reportId === currentView?.reportId}
                                    className="saved-finder-view"
                                >
                                    {savedSearch.reportName}
                                </MenuItem>
                            );
                        })}
                    </>
                )}
                {savedSearches?.length === 0 && <MenuItem header>No Saved Search</MenuItem>}
                <MenuItem divider />
                {moduleSearches?.length > 0 && (
                    <>
                        <MenuItem header>Other Reports</MenuItem>
                        {moduleSearches.map((moduleReport, ind) => {
                            return (
                                <MenuItem
                                    key={ind + 'mod'}
                                    onClick={onLoadModuleSearch}
                                    name={moduleReport.reportId}
                                    active={moduleReport.reportId === currentView?.reportId}
                                    className="built-in-finder-view"
                                >
                                    {moduleReport.reportName}
                                </MenuItem>
                            );
                        })}
                        <MenuItem divider />
                    </>
                )}
                <MenuItem onClick={onManageView} disabled={!hasSavedView} className="saved-finder-menu-action-item">
                    Manage saved searches
                </MenuItem>
                <MenuItem
                    onClick={onSaveNewView}
                    disabled={!currentView && !hasUnsavedChanges}
                    className="saved-finder-menu-action-item"
                >
                    Save as custom search
                </MenuItem>
            </DropdownButton>
            {hasUnsavedChanges && currentView?.reportId && !currentView?.isModuleReport && (
                <SplitButton
                    id="save-finderview-dropdown"
                    bsStyle="success"
                    onClick={onSaveCurrentView}
                    title="Save Search"
                >
                    <MenuItem title="Save as a new search" onClick={onSaveNewView} key="saveNewGridView">
                        Save as...
                    </MenuItem>
                </SplitButton>
            )}
            {hasUnsavedChanges && (!currentView?.reportId || currentView?.isModuleReport) && (
                <Button bsStyle="success" onClick={onSaveNewView} className="margin-left">
                    Save Search
                </Button>
            )}
        </>
    );
});
