/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { fromJS, Map } from 'immutable';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';

import { SearchResultCard, SearchResultsPanel, SearchResultCardData, SearchResultsModel } from '..';

import entitiesJSON from '../test/data/searchResults.json';

import { getProcessedSearchHits } from '../internal/components/search/actions';

import { ICON_URL } from './mock';
import './stories.scss';

storiesOf('SearchResults', module)
    .addDecorator(withKnobs)
    .add('search result card', () => {
        const cardData = {
            title: 'Sample - 20190101.123',
            typeName: 'Sample Type 1',
            category: 'Samples',
        };
        return (
            <SearchResultCard
                iconUrl={ICON_URL}
                summary={text('summary', 'This sample is from the lineage of some important samples for sure.')}
                url={text('url', '#samples')}
                cardData={cardData}
            />
        );
    })
    .add('search result panel', () => {
        const hits = getProcessedSearchHits(entitiesJSON['hits']);
        const model = SearchResultsModel.create({
            isLoading: boolean('isLoading', false),
            error: text('error', ''),
            entities: Map(fromJS({ ...entitiesJSON, hits })),
        });

        return <SearchResultsPanel iconUrl={ICON_URL} model={model} />;
    })
    .add('search result panel with custom card data', () => {
        const hits = getProcessedSearchHits(
            entitiesJSON['hits'],
            (data, category): SearchResultCardData => {
                if (data && data['name'] === 'M-1')
                    return {
                        iconSrc: 'test-IconSrc',
                        altText: 'test-alt-text',
                        title: 'Test title',
                        typeName: 'other',
                    };

                return {};
            }
        );
        const model = SearchResultsModel.create({
            isLoading: boolean('isLoading', false),
            error: text('error', ''),
            entities: Map(fromJS({ ...entitiesJSON, hits })),
        });

        return <SearchResultsPanel iconUrl={ICON_URL} model={model} />;
    });
