import React, { ChangeEvent, FC, FormEvent, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from 'react-bootstrap';

import { Page } from '../base/Page';
import { Section } from '../base/Section';

import { HelpLink } from '../../util/helpLinks';

import { resolveErrorMessage } from '../../util/messaging';

import { PaginationButtons } from '../buttons/PaginationButtons';

import { biologicsIsPrimaryApp } from '../../app/utils';

import { useServerContext } from '../base/ServerContext';

import { SearchResultsPanel } from './SearchResultsPanel';

import { SearchResultsModel } from './models';
import { SearchCategory, SEARCH_HELP_TOPIC, SEARCH_PAGE_DEFAULT_SIZE } from './constants';
import { GetCardDataFn, searchUsingIndex } from './actions';

interface SearchPanelProps {
    appName: string;
    getCardDataFn: GetCardDataFn;
    offset?: number; // Result number to start from
    pageSize?: number; // number of results to return/display
    search: (form: any) => any;
    searchTerm: string;
}

export interface SearchPanelImplProps extends Omit<SearchPanelProps, 'getCardDataFn'> {
    model: SearchResultsModel;
    onPageChange: (direction: number) => void;
}

export const SearchPanelImpl: FC<SearchPanelImplProps> = memo(props => {
    const { appName = 'Labkey', searchTerm, model, search, onPageChange, pageSize, offset } = props;
    const [searchQuery, setSearchQuery] = useState<string>(searchTerm);

    const title = useMemo(() => (searchTerm ? 'Search Results' : 'Search'), [searchTerm]);
    const totalHits = useMemo(() => model?.getIn(['entities', 'totalHits']), [model]);
    const currentPage = offset / pageSize ? offset / pageSize : 0;

    useEffect(() => {
        setSearchQuery(searchTerm);
    }, [searchTerm]);

    const emptyTextMessage = useMemo((): ReactNode => {
        return (
            <div className="search-panel__no-results panel-body">
                <div className="font-large">No Results Found</div>
                <hr />
                <div>
                    We suggest to check your spelling or broaden your search.
                    <br />
                    <br />
                    Can’t find what you’re looking for? Check the{' '}
                    <HelpLink topic={SEARCH_HELP_TOPIC}>documentation</HelpLink> for {appName}
                </div>
            </div>
        );
    }, [appName]);

    const pageBack = useCallback(() => {
        onPageChange(-1);
    }, [onPageChange]);

    const pageForward = useCallback(() => {
        onPageChange(1);
    }, [onPageChange]);

    const onSearchChange = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            setSearchQuery(evt.target.value);
        },
        [setSearchQuery]
    );

    const onSubmit = useCallback(
        (evt: FormEvent<HTMLFormElement> | undefined) => {
            evt?.preventDefault();
            search({ q: searchQuery });
        },
        [search, searchQuery]
    );

    const onSearchClick = useCallback(() => {
        onSubmit(undefined);
    }, [onSubmit]);

    const hasPages = totalHits > pageSize;

    const helpLink = (
        <HelpLink topic={SEARCH_HELP_TOPIC} className="search-form__help-link">
            <i className="fa fa-question-circle search-form__help-icon" />
            Help with search
        </HelpLink>
    );

    return (
        <Page hasHeader={false} title={title}>
            <Section panelClassName="test-loc-search-panel" title={title} context={helpLink}>
                <div className="search-form panel-body">
                    <form onSubmit={onSubmit}>
                        <span className="input-group">
                            <span className="input-group-addon clickable" onClick={onSearchClick}>
                                <i className="fa fa-search search-icon" />
                            </span>
                            <input
                                className="form-control search-input"
                                onChange={onSearchChange}
                                placeholder="Search"
                                size={34}
                                type="text"
                                value={searchQuery}
                            />
                        </span>
                    </form>
                    <Button type="submit" className="margin-left success submit-button" onClick={onSearchClick}>
                        Search
                    </Button>
                    {hasPages && (
                        <div className="page-buttons">
                            <PaginationButtons
                                total={totalHits}
                                currentPage={currentPage}
                                perPage={pageSize}
                                previousPage={pageBack}
                                nextPage={pageForward}
                            />
                        </div>
                    )}
                </div>
                {searchTerm && (
                    <SearchResultsPanel
                        model={model}
                        hidePanelFrame={true}
                        emptyResultDisplay={emptyTextMessage}
                        offset={offset}
                    />
                )}
            </Section>
        </Page>
    );
});

const SEARCH_CATEGORIES = [
    SearchCategory.Assay,
    SearchCategory.AssayBatch,
    SearchCategory.AssayRun,
    SearchCategory.Data,
    SearchCategory.DataClass,
    SearchCategory.File,
    SearchCategory.FileWorkflowJob,
    SearchCategory.Material,
    SearchCategory.MaterialSource,
    SearchCategory.Notebook,
    SearchCategory.NotebookTemplate,
    SearchCategory.WorkflowJob,
];
const MEDIA_SEARCH_CATEGORIES = [SearchCategory.Media, SearchCategory.MediaData];

export const SearchPanel: FC<SearchPanelProps> = memo(props => {
    const { searchTerm, getCardDataFn, search, pageSize = SEARCH_PAGE_DEFAULT_SIZE, offset = 0 } = props;
    const [model, setModel] = useState<SearchResultsModel>(() => SearchResultsModel.create({ isLoading: true }));
    const { moduleContext } = useServerContext();
    const isBiologics = biologicsIsPrimaryApp(moduleContext);
    const category = useMemo(
        () => (isBiologics ? [...SEARCH_CATEGORIES, ...MEDIA_SEARCH_CATEGORIES] : SEARCH_CATEGORIES),
        [isBiologics]
    );

    const loadSearchResults = useCallback(async () => {
        if (searchTerm) {
            setModel(SearchResultsModel.create({ isLoading: true }));
            try {
                const entities = await searchUsingIndex(
                    {
                        category,
                        q: searchTerm,
                        limit: pageSize,
                        offset,
                    },
                    getCardDataFn
                );
                setModel(SearchResultsModel.create({ entities, isLoaded: true }));
            } catch (response) {
                console.error(response);
                setModel(
                    SearchResultsModel.create({
                        isLoaded: true,
                        error: resolveErrorMessage(response.exception) ?? 'Unknown error getting search results.',
                    })
                );
            }
        }
    }, [category, getCardDataFn, offset, pageSize, searchTerm]);

    useEffect(() => {
        (async () => {
            await loadSearchResults();
        })();
    }, [loadSearchResults, searchTerm]);

    const onPage = useCallback(
        direction => {
            // because JS is dumb and treats offset as a string...
            const newOffset = direction * pageSize + offset * 1;
            search({ q: searchTerm, pageSize, offset: newOffset });
        },
        [search, searchTerm, pageSize, offset]
    );

    return <SearchPanelImpl {...props} search={search} model={model} onPageChange={onPage} offset={offset} />;
});
