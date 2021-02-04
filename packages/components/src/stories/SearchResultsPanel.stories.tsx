/*
 * Copyright (c) 2019-2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { fromJS, Map } from 'immutable';
import { Meta, Story } from '@storybook/react/types-6-0';

import { SearchResultsPanel, SearchResultsModel } from '..';
import { getProcessedSearchHits } from '../internal/components/search/actions';

import entitiesJSON from '../test/data/searchResults.json';

import { ICON_URL } from './mock';

export default {
    title: 'Components/SearchResults',
    component: SearchResultsPanel,
    argTypes: {
        iconURL: {
            control: { disable: true },
            table: { disable: true },
        },
        model: {
            control: { disable: true },
            table: { disable: true },
        },
    },
} as Meta;

export const SearchResultsPanelStory: Story = props => (
    <SearchResultsPanel {...(props as any)} iconUrl={ICON_URL} model={SearchResultsModel.create(props.model ?? {})} />
);
SearchResultsPanelStory.storyName = 'SearchResultsPanel';

SearchResultsPanelStory.args = {
    model: {
        isLoading: false,
        entities: Map(fromJS({ ...entitiesJSON, hits: getProcessedSearchHits(entitiesJSON.hits) })),
        error: '',
    },
};

export const WithCustomCards = SearchResultsPanelStory.bind({});
WithCustomCards.storyName = 'SearchResultsPanel With Custom Cards';

WithCustomCards.args = {
    model: {
        isLoading: false,
        entities: Map(
            fromJS({
                ...entitiesJSON,
                hits: getProcessedSearchHits(entitiesJSON.hits, (data: any) => {
                    if (data?.name === 'M-1') {
                        return {
                            altText: 'test-alt-text',
                            iconSrc: 'test-IconSrc',
                            title: 'Test title',
                            typeName: 'other',
                        };
                    }

                    return {};
                }),
            })
        ),
        error: '',
    },
};
