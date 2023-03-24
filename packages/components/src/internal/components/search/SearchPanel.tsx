import React, { FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import Formsy from 'formsy-react';

import { Input } from 'formsy-react-components';

import { Button } from 'react-bootstrap';

import { Page } from '../base/Page';
import { Section } from '../base/Section';

import { User } from '../base/models/User';

import { HelpLink } from '../../util/helpLinks';

import { resolveErrorMessage } from '../../util/messaging';

import { SearchResultsPanel } from './SearchResultsPanel';

import { SearchResultCardData, SearchResultsModel } from './models';
import { SEARCH_HELP_TOPIC, SearchScope } from './constants';
import { GetCardDataFn, searchUsingIndex } from './actions';

interface Props {
    appName: string;
    search: (form: any) => void;
    searchResultsModel: SearchResultsModel;
    searchTerm: string;
    user: User;
}

export const SearchPanelImpl: FC<Props> = memo(props => {
    const { appName, searchTerm, searchResultsModel, search } = props;
    const title = useMemo(() => (searchTerm ? 'Search Results' : 'Search'), [searchTerm]);

    const emptyTextMessage = useMemo((): ReactNode => {
        return (
            <div>
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

    return (
        <Page hasHeader={false} title={title}>
            <Section panelClassName="test-loc-search-panel" title={title}>
                <div className="row">
                    <div className="col-md-12">
                        <Formsy className="form-horizontal" onValidSubmit={search}>
                            <div className="form-group col-sm-12">
                                <Input
                                    changeDebounceInterval={0}
                                    type="text"
                                    labelClassName="control-label text-right"
                                    elementWrapperClassName="col-sm-12"
                                    placeholder="Search"
                                    value={searchTerm ? searchTerm : ''}
                                    name="searchTerm"
                                    validations="isExisty"
                                />
                            </div>
                            <Button type="submit">Search</Button>
                        </Formsy>
                    </div>
                </div>
                {searchTerm && (
                    <SearchResultsPanel
                        model={searchResultsModel}
                        hidePanelFrame={true}
                        hideHeader={true}
                        emptyResultDisplay={emptyTextMessage}
                    />
                )}
            </Section>
        </Page>
    );
});

interface SearchPanelProps {
    getCardDataFn: GetCardDataFn;
    search: (form: any) => any;
    searchTerm: string;
}

export const SearchPanel: FC<SearchPanelProps> = memo(props => {
    const { searchTerm, getCardDataFn, search } = props;
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
    }, [getCardDataFn, searchQuery]);

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

    return <SearchPanelImpl {...props} search={onSearch} searchResultsModel={model} searchTerm={searchQuery} user={} />;
});
