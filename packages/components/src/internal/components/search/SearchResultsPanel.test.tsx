/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { fromJS, Map } from 'immutable';

import entitiesJSON from '../../../test/data/searchResults.json';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { SearchResultsPanel } from './SearchResultsPanel';
import { SearchResultsModel } from './models';
import { getProcessedSearchHits } from './actions';

describe('<SearchResultsPanel/>', () => {
    function verifyPanel(loadingCount: number, alertCount: number, cardCount: number) {
        expect(document.getElementsByClassName('fa-spinner').length).toBe(loadingCount);
        expect(document.getElementsByClassName('alert').length).toBe(alertCount);
        expect(document.getElementsByClassName('search-result__card-container').length).toBe(cardCount);
    }

    test('loading', async () => {
        const model = SearchResultsModel.create({ isLoading: true });
        const component = <SearchResultsPanel model={model} />;
        renderWithAppContext(component);
        verifyPanel(1, 0, 0);
    });

    test('with error', async () => {
        const model = SearchResultsModel.create({ error: 'Test error message' });
        const component = <SearchResultsPanel model={model} />;
        renderWithAppContext(component);
        verifyPanel(0, 1, 0);
    });

    test('with no search hits', async () => {
        const model = SearchResultsModel.create({ entities: fromJS({ hits: [] }) });
        const component = <SearchResultsPanel model={model} />;
        renderWithAppContext(component);
        verifyPanel(0, 0, 0);
    });

    test('with search hits', async () => {
        const hits = getProcessedSearchHits(entitiesJSON['hits']);
        const model = SearchResultsModel.create({
            entities: Map(fromJS({ ...entitiesJSON, hits })),
        });

        const component = <SearchResultsPanel model={model} />;
        renderWithAppContext(component);
        verifyPanel(0, 0, 49);
    });
});
