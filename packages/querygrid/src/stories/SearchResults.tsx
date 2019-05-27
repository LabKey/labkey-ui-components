import * as React from 'react';
import { Map, fromJS } from 'immutable';
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'

import { SearchResultCard } from "../components/search/SearchResultCard";
import { SearchResultsPanel } from "../components/search/SearchResultsPanel";
import { SearchResultsModel } from "../model";
import entitiesJSON from "../test/data/searchResults.json";
import './stories.scss'

storiesOf('SearchResults', module)
    .addDecorator(withKnobs)
    .add("search result cart", () => {
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