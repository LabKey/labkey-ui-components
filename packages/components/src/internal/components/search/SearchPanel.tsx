import React, { ChangeEvent, FC, FormEvent, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from 'react-bootstrap';

import { Page } from '../base/Page';
import { Section } from '../base/Section';

import { HelpLink } from '../../util/helpLinks';

import { resolveErrorMessage } from '../../util/messaging';

import { PaginationButtons } from '../buttons/PaginationButtons';

import { SearchResultsPanel } from './SearchResultsPanel';

import { SearchResultsModel } from './models';
import { SEARCH_HELP_TOPIC, SEARCH_PAGE_DEFAULT_SIZE, SearchScope } from './constants';
import { GetCardDataFn, searchUsingIndex } from './actions';

interface Props {
    appName: string;
    offset: number;
    onPage: (direction: number) => void;
    pageSize?: number;
    search: (form: any) => void;
    searchResultsModel: SearchResultsModel;
    searchTerm: string;
}

export const SearchPanelImpl: FC<Props> = memo(props => {
    const { appName, searchTerm, searchResultsModel, search, onPage, pageSize, offset } = props;
    const [searchQuery, setSearchQuery] = useState<string>(searchTerm);

    const title = useMemo(() => (searchTerm ? 'Search Results' : 'Search'), [searchTerm]);
    const totalHits = useMemo(() => searchResultsModel?.getIn(['entities', 'totalHits']), [searchResultsModel]);
    const currentPage = offset / pageSize ? offset / pageSize : 0;

    const emptyTextMessage = useMemo((): ReactNode => {
        return (
            <div className="search-panel__no-results">
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
        onPage(-1);
    }, [onPage]);

    const pageForward = useCallback(() => {
        onPage(1);
    }, [onPage]);

    const onSearchChange = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            setSearchQuery(evt.target.value);
        },
        [setSearchQuery]
    );

    const onSubmit = useCallback(
        (evt: FormEvent<HTMLFormElement> | undefined) => {
            evt?.preventDefault();
            search({ searchTerm: searchQuery });
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
                <div className="search-form">
                    <form className="col-md-8" onSubmit={onSubmit}>
                        {/* <i className="fa fa-search search-icon" />  // TODO can't get this to layout correctly*/}
                        <input
                            className="form-control search-input"
                            onChange={onSearchChange}
                            placeholder="Search"
                            size={34}
                            type="text"
                            value={searchQuery}
                        />
                    </form>
                    <Button type="submit" className="margin-left success submit-button" onClick={onSearchClick}>
                        Search
                    </Button>
                    {hasPages && (
                        <div className="page-buttons col-md-3">
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
                        model={searchResultsModel}
                        hidePanelFrame={true}
                        emptyResultDisplay={emptyTextMessage}
                        offset={offset}
                    />
                )}
            </Section>
        </Page>
    );
});

interface SearchPanelProps {
    getCardDataFn: GetCardDataFn;
    offset?: number; // Result number to start from
    pageSize?: number; // number of results to return/display
    search: (form: any) => any;
    searchTerm: string;
}

export const SearchPanel: FC<SearchPanelProps> = memo(props => {
    const { searchTerm, getCardDataFn, search, pageSize = SEARCH_PAGE_DEFAULT_SIZE, offset = 0 } = props;
    const [searchQuery, setSearchQuery] = useState<string>(searchTerm);
    const [model, setModel] = useState<SearchResultsModel>(SearchResultsModel.create({ isLoading: true }));

    const loadSearchResults = useCallback(async () => {
        if (searchQuery) {
            setModel(SearchResultsModel.create({ isLoading: true }));
            try {
                const entities = await searchUsingIndex(
                    {
                        experimentalCustomJson: true, // will return extra info about entity types and material results
                        normalizeUrls: true, // this flag will remove the containerID from the returned URL
                        q: searchQuery,
                        scope: SearchScope.Folder, // TODO should this be a parameter/prop?   // only using folder for this application
                        limit: pageSize,
                        offset,
                    },
                    getCardDataFn
                );
                setModel(
                    SearchResultsModel.create({
                        isLoaded: true,
                        entities,
                    })
                );
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
    }, [getCardDataFn, offset, pageSize, searchQuery]);

    useEffect(() => {
        (async () => {
            await loadSearchResults();
        })();
    }, [loadSearchResults, searchQuery, searchTerm]);

    const onSearch = useCallback(
        (form: any): void => {
            search(form);
            setSearchQuery(form.searchTerm);
        },
        [search]
    );

    const onPage = useCallback(
        direction => {
            const newOffset = offset + direction * pageSize;
            search({ searchTerm, pageSize, offset: newOffset });
        },
        [search, searchTerm, pageSize, offset]
    );

    return (
        <SearchPanelImpl
            {...props}
            search={onSearch}
            searchResultsModel={model}
            searchTerm={searchQuery}
            appName="Labkey Sample Manager"
            onPage={onPage}
            offset={offset}
        />
    );
});
