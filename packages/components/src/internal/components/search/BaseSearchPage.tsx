import React, { FC, memo, useCallback, useEffect, useState } from 'react';

import { getCurrentAppProperties } from '../../app/utils';

import { getSearchResultCardData } from './utils';
import { SEARCH_PAGE_DEFAULT_SIZE } from './constants';
import { SearchPanel } from './SearchPanel';
import { GetCardDataFn } from './actions';

export interface SearchForm {
    offset?: number;
    pageSize?: number;
    q: string;
    search: (form: Partial<SearchForm>) => any;
    searchMetadata?: any;
}

export const BaseSearchPage: FC<SearchForm> = memo(props => {
    const { search, q, offset: queryOffset, pageSize: queryPageSize, searchMetadata } = props;
    const [searchTerm, setSearchTerm] = useState<string>(q);
    const [offset, setOffset] = useState<number>(queryOffset);
    const [pageSize, setPageSize] = useState<number>(queryPageSize);

    useEffect(() => {
        setSearchTerm(q);
    }, [q]);

    useEffect(() => {
        if (queryOffset < 0 || isNaN(queryOffset)) setOffset(0);
        else setOffset(queryOffset);
    }, [queryOffset]);

    useEffect(() => {
        let newPageSize = queryPageSize;
        if (queryPageSize <= 0 || isNaN(queryPageSize)) newPageSize = SEARCH_PAGE_DEFAULT_SIZE;
        setPageSize(newPageSize);
    }, [queryPageSize]);

    const handleCardData = useCallback<GetCardDataFn>(
        (data, category) => getSearchResultCardData(data, category, searchMetadata),
        [searchMetadata]
    );

    return (
        <SearchPanel
            appName={getCurrentAppProperties().name}
            search={search}
            getCardDataFn={handleCardData}
            searchTerm={searchTerm}
            pageSize={pageSize}
            offset={offset}
        />
    );
});
