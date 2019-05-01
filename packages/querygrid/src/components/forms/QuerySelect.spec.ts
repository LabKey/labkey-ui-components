/*
 * Copyright (c) 2017 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */

// immutable
import * as Immutable from 'immutable'
let Map = Immutable.Map;

// Tested components
import { QuerySelectModel } from './model'
// import { INPUT_TYPES } from './constants'
// import reducer, { parseSelectedQuery } from './reducers'

describe('Query Select', () => {
    describe('Query Select Reducer', () => {
        // Input reducer has a state of {selects: Map<string, QuerySelectModel>}
        // Cleans up adding {selects: [value]} to each test data object
        function addSelectsKey (value) {
            return {
                selects: value
            }
        }

        // Shared resources
        const initialState = addSelectsKey(Map<string, QuerySelectModel>());
        const populatedModel = new QuerySelectModel({id: 'testState', isInit: true})
        const populatedState = Map<string, QuerySelectModel>({
            'testState': populatedModel
        });

        const setSelectionModel = new QuerySelectModel({
            displayColumn: 'DATA',
            id: 'selection',
            isInit: true,
        });

        const searchResults = Immutable.fromJS({
            '123': {
                DATA: {
                    value: 'A-1'
                }
            },

            '456': {
                DATA: {
                    value: 'B-1'
                }
            }
        });

        const searchResults2 = Immutable.fromJS({
            '789': {
                DATA: {
                    value: 'C-1'
                }
            }
        });

        const searchResults3 = Immutable.fromJS({
            '123': {
                DATA: {
                    value: 'A-1'
                },
                NAME: {
                    value: 'Ron Swanson'
                }
            },

            '456': {
                DATA: {
                    value: 'B-1'
                },
                NAME: {
                    value: 'Swan Ronson'
                }
            }
        });

        // TODO QuerySelect Task: re-enable / refactor
        // test('Should return the initial state', () => {
        //     expect(reducer(initialState, {type: ''})).toEqual(addSelectsKey(Map()));
        // });
        //
        // test('Should initialize the requested model and id', () => {
        //
        //     const initAction = {
        //         type: INPUT_TYPES.INIT_SELECT,
        //         id: 'testState'
        //     };
        //
        //     expect(
        //         Immutable.is(reducer(initialState, initAction)['selects'], populatedState)
        //     ).toEqual(true);
        // });
        //
        // test('Should destroy the requested model', () => {
        //     const destroyAction = {
        //         type: INPUT_TYPES.DESTROY,
        //         model: populatedModel
        //     };
        //
        //     expect(
        //         Immutable.is(reducer(addSelectsKey(populatedState), destroyAction)['selects'], initialState.selects)
        //     ).toBe(true);
        // });
        //
        // test('Should reset the preLoad flag', () => {
        //     const preLoadAction = {
        //         type: INPUT_TYPES.RESET_PRELOAD,
        //         id: 'preLoadModel'
        //     };
        //
        //     const preLoadFalseModel = new QuerySelectModel({
        //         id: 'preLoadModel',
        //         isInit: true,
        //         preLoad: false
        //     });
        //
        //     const preLoadState = Map<string, QuerySelectModel>({
        //         'preLoadModel': preLoadFalseModel
        //     });
        //
        //     const preLoadTrueModel = new QuerySelectModel({
        //         id: 'preLoadModel',
        //         isInit: true,
        //         preLoad: true
        //     });
        //
        //     expect(
        //         Immutable.is(
        //             reducer(addSelectsKey(preLoadState), preLoadAction)['selects'].get('preLoadModel'),
        //             preLoadTrueModel
        //         )
        //     ).toBe(true);
        // });
        //
        // test('Should save queried results', () => {
        //     const searchResultsModel = new QuerySelectModel({
        //         allResults: searchResults,
        //         id: 'testState',
        //         isInit: true,
        //         searchResults
        //     });
        //
        //     const searchResultsModel2 = new QuerySelectModel({
        //         allResults: searchResultsModel.allResults.merge(searchResults2),
        //         id: 'testState',
        //         isInit: true,
        //         searchResults: searchResults2
        //     });
        //
        //     const saveResultsAction = {
        //         type: INPUT_TYPES.SAVE_RESULTS,
        //         model: populatedModel,
        //         searchResults
        //     };
        //
        //     const saveResultsAction2 = {
        //         type: INPUT_TYPES.SAVE_RESULTS,
        //         model: searchResultsModel,
        //         searchResults: searchResults2
        //     };
        //
        //     expect(
        //         Immutable.is(
        //             reducer(addSelectsKey(populatedState), saveResultsAction)['selects'].get('testState'),
        //             searchResultsModel
        //         )
        //     ).toBe(true);
        //
        //     expect(
        //         Immutable.is(
        //             reducer(addSelectsKey(populatedState), saveResultsAction2)['selects'].get('testState'),
        //             searchResultsModel2
        //         )
        //     ).toBe(true);
        // });
        //
        // test('Should set a selection value', () => {
        //     const setSelectionState = Map({
        //         'selection': setSelectionModel
        //     });
        //
        //     const setSelectAction = {
        //         type: INPUT_TYPES.SET_SELECTION,
        //         model: setSelectionModel,
        //         rawSelectedValue: 'C-1',
        //         selectedItems: searchResults2
        //     };
        //
        //     const setSelectionModel2 = new QuerySelectModel({
        //         displayColumn: 'DATA',
        //         id: 'selection',
        //         isInit: true,
        //         preLoad: false,
        //         rawSelectedValue: 'C-1',
        //         selectedItems: searchResults2,
        //         selectedQuery: 'C-1',
        //         value: undefined
        //     });
        //
        //     expect(
        //         Immutable.is(
        //             reducer(addSelectsKey(setSelectionState), setSelectAction)['selects'].get('selection'),
        //             setSelectionModel2
        //         )
        //     ).toBe(true);
        // });
        //
        // test('Should parse a selected query', () => {
        //     const parsed = parseSelectedQuery(setSelectionModel, searchResults2);
        //
        //     const parsedSelectionModel = new QuerySelectModel({
        //         displayColumn: 'NAME',
        //         delimiter: ';'
        //     });
        //
        //     const parsed2 = parseSelectedQuery(parsedSelectionModel, searchResults3);
        //
        //     expect(parsed).toBe('C-1');
        //     expect(parsed2).toBe('Ron Swanson;Swan Ronson');
        // });
    });
});