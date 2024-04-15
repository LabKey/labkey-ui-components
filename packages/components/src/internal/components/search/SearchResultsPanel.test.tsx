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

import entitiesJSON from '../../../test/data/searchResults.json';

import { SearchResultsPanel } from './SearchResultsPanel';
import { SearchResultsModel } from './models';
import { getProcessedSearchHits } from './actions';
import { act } from '@testing-library/react';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

describe('<SearchResultsPanel/>', () => {
    function verifyPanel(loadingCount: number, alertCount: number, cardCount: number) {
        expect(document.getElementsByClassName('fa-spinner').length).toBe(loadingCount);
        expect(document.getElementsByClassName('alert').length).toBe(alertCount);
        expect(document.getElementsByClassName('search-result__card-container').length).toBe(cardCount);
    }

    test('loading', async () => {

        const model = SearchResultsModel.create({ isLoading: true });
        const component = <SearchResultsPanel model={model} />;
        await act(async () => {
            renderWithAppContext(component);
        });

        verifyPanel(1, 0, 0);
    });

    test('with error', async () => {
        const model = SearchResultsModel.create({ error: 'Test error message' });
        const component = <SearchResultsPanel model={model} />;
        await act(async () => {
            renderWithAppContext(component);
        });

        verifyPanel(0, 1, 0);
    });

    test('with no search hits', async () => {
        const model = SearchResultsModel.create({ entities: fromJS({ hits: [] }) });
        const component = <SearchResultsPanel model={model} />;
        await act(async () => {
            renderWithAppContext(component);
        });

        verifyPanel(0, 0, 0);
    });

    test('with search hits', async () => {
        const hits = getProcessedSearchHits(entitiesJSON['hits']);
        const model = SearchResultsModel.create({
            entities: Map(fromJS({ ...entitiesJSON, hits })),
        });

        const component = <SearchResultsPanel model={model} />;
        await act(async () => {
            renderWithAppContext(component);
        });

        verifyPanel(0, 0, 49);
    });
});
