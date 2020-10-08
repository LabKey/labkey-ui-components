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
import { mount } from 'enzyme';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { Alert } from '../base/Alert';

import entitiesJSON from '../../../test/data/searchResults.json';

import { SearchResultCard } from './SearchResultCard';
import { SearchResultsPanel } from './SearchResultsPanel';
import { SearchResultsModel } from './models';
import { getProcessedSearchHits } from './actions';

describe('<SearchResultsPanel/>', () => {
    test('loading', () => {
        const model = SearchResultsModel.create({ isLoading: true });
        const component = <SearchResultsPanel model={model} />;

        const wrapper = mount(component);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
        expect(wrapper.find(Alert)).toHaveLength(0);
        expect(wrapper.find(SearchResultCard)).toHaveLength(0);
        wrapper.unmount();
    });

    test('with error', () => {
        const model = SearchResultsModel.create({ error: 'Test error message' });
        const component = <SearchResultsPanel model={model} />;

        const wrapper = mount(component);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find(SearchResultCard)).toHaveLength(0);
        wrapper.unmount();
    });

    test('with no search hits', () => {
        const model = SearchResultsModel.create({ entities: fromJS({ hits: [] }) });
        const component = <SearchResultsPanel model={model} />;

        const wrapper = mount(component);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.find(Alert)).toHaveLength(0);
        expect(wrapper.find(SearchResultCard)).toHaveLength(0);
        wrapper.unmount();
    });

    test('with search hits', () => {
        const hits = getProcessedSearchHits(entitiesJSON['hits']);
        const model = SearchResultsModel.create({
            entities: Map(fromJS({ ...entitiesJSON, hits })),
        });

        const component = <SearchResultsPanel model={model} />;

        const wrapper = mount(component);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.find(Alert)).toHaveLength(0);
        expect(wrapper.find(SearchResultCard)).toHaveLength(47);
        wrapper.unmount();
    });
});
