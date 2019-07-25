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
import * as React from 'react';
import { Map, fromJS } from 'immutable';
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'

import { SearchResultCard } from "../components/search/SearchResultCard";
import { SearchResultsPanel } from "../components/search/SearchResultsPanel";
import { SearchResultsModel } from "../models";
import entitiesJSON from "../test/data/searchResults.json";
import './stories.scss'

storiesOf('SearchResults', module)
    .addDecorator(withKnobs)
    .add("search result card", () => {
        return (
            <SearchResultCard
                iconUrl={'http://labkey.wpengine.com/wp-content/uploads/2015/12/cropped-LK-icon.png'}
                title={text('title', 'Sample - 20190101.123')}
                summary={text('summary', 'This sample is from the lineage of some important samples for sure.')}
                url={text('url', '#samples')}
                data={Map(fromJS({sampleSet: {name: 'Sample Set 1'}}))}
            />
        )
    })
    .add("search result panel", () => {
        const model = SearchResultsModel.create({
            isLoading: boolean('isLoading', false),
            error: text('error', ''),
            entities: Map(fromJS(entitiesJSON))
        });

        return (
            <SearchResultsPanel
                iconUrl={'http://labkey.wpengine.com/wp-content/uploads/2015/12/cropped-LK-icon.png'}
                model={model}
            />
        )
    });