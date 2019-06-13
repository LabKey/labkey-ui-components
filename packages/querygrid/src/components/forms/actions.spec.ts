/*
 * Copyright (c) 2017 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { fromJS } from 'immutable'

// Tested components
import { QuerySelectModel } from './model'
import { parseSelectedQuery } from "./actions";

describe('form actions', () => {
    const setSelectionModel = new QuerySelectModel({
        displayColumn: 'DATA',
        id: 'selection',
        isInit: true,
    });

    const searchResults2 = fromJS({
        '789': {
            DATA: {
                value: 'C-1'
            }
        }
    });

    const searchResults3 = fromJS({
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

    test('Should parse a selected query', () => {
        const parsed = parseSelectedQuery(setSelectionModel, searchResults2);

        const parsedSelectionModel = new QuerySelectModel({
            displayColumn: 'NAME',
            delimiter: ';'
        });

        const parsed2 = parseSelectedQuery(parsedSelectionModel, searchResults3);

        expect(parsed).toBe('C-1');
        expect(parsed2).toBe('Ron Swanson;Swan Ronson');
    });
});