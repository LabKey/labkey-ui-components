/*
 * Copyright (c) 2018-2019 LabKey Corporation
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

import { mount, shallow } from 'enzyme';

import { fromJS } from 'immutable';

import { QueryGridModel, QueryInfo } from '../../../index';

import { initUnitTests, makeQueryInfo, makeTestData } from '../../../testHelpers';
import mixturesQueryInfo from '../../../test/data/mixtures-getQueryDetails.json';
import mixturesQuery from '../../../test/data/mixtures-getQuery.json';

import { Action, ActionOption, ActionValue, Value } from './actions/Action';
import { OmniBox, OmniBoxState } from './OmniBox';
import { Query } from '@labkey/api';

let queryInfo: QueryInfo;
let model: QueryGridModel;
const getColumns = (all?) => all ? model.getAllColumns() : model.getDisplayColumns();
const getSelectDistinctOptions = (column: string): Query.SelectDistinctOptions => {
    return {
        column,
        containerFilter: model.containerFilter,
        containerPath: model.containerPath,
        schemaName: model.schema,
        queryName: model.query,
        viewName: model.view,
        filterArray: model.getFilters().toJS(),
        parameters: model.queryParameters,
    };
};

beforeAll(() => {
    initUnitTests();
    queryInfo = makeQueryInfo(mixturesQueryInfo);
    return makeTestData(mixturesQuery).then(mockData => {
        model = new QueryGridModel({
            queryInfo,
            messages: fromJS(mockData.messages),
            data: fromJS(mockData.rows),
            dataIds: fromJS(mockData.orderedRows),
            totalRows: mockData.rowCount,
        });
    });
});

export class HelloWorldAction implements Action {
    keyword = 'hello';
    iconCls: 'globe';
    oneWordLabel: 'hello';
    optionalLabel: 'world';
    param = 'hello';

    completeAction(tokens: string[]): Promise<Value> {
        return Promise.resolve({
            value: 'world',
            param: 'hello',
        });
    }

    fetchOptions(tokens: string[]): Promise<ActionOption[]> {
        const option: ActionOption = {
            label: 'World!!!',
        };

        return Promise.resolve([option]);
    }

    buildParams(actionValues: ActionValue[]): Array<{ paramKey: string; paramValue: string }> {
        let value = '',
            sep = '';

        for (let i = 0; i < actionValues.length; i++) {
            value += sep + actionValues[i].value;
            sep = ';';
        }

        return [
            {
                paramKey: this.param,
                paramValue: value,
            },
        ];
    }

    matchParam(paramKey: string, paramValue: any): boolean {
        return paramKey && paramKey.toLowerCase() === this.param;
    }

    parseParam(paramKey: string, paramValue: any): string[] | Value[] {
        return paramValue.split(';');
    }
}

describe('OmniBox component', () => {
    const actions = [new HelloWorldAction()];

    test('requires only an action', () => {
        const component = shallow<OmniBox>(<OmniBox getColumns={getColumns} getSelectDistinctOptions={getSelectDistinctOptions} actions={actions} />);

        expect(component.find('.OmniBox').length).toBe(1);
    });

    test('respects openAfterFocus', () => {
        // True
        const openComponent = mount<OmniBox>(<OmniBox getColumns={getColumns} getSelectDistinctOptions={getSelectDistinctOptions} actions={actions} openAfterFocus={true} />);
        const openControlElement = openComponent.find('.OmniBox-control');

        expect(openControlElement.length).toEqual(1);

        openControlElement.simulate('click', { button: 0 });

        const openState: OmniBoxState = openComponent.state();
        expect(openState.isOpen).toBe(true);
        expect(openState.options.length).toBe(1);
        // False

        const closedComponent = mount<OmniBox>(<OmniBox getColumns={getColumns} getSelectDistinctOptions={getSelectDistinctOptions} actions={actions} openAfterFocus={false} />);
        const closedControlElement = closedComponent.find('.OmniBox-control');

        expect(closedControlElement.length).toEqual(1);
        const closedState: OmniBoxState = closedComponent.state();
        closedControlElement.simulate('mousedown', { button: 0 });

        expect(closedState.isOpen).toBe(false);
        expect(closedState.options.length).toBe(0);
    });
});

describe('OmniBox stripKeyword', () => {
    const strip = OmniBox.stripKeyword;
    const action = new HelloWorldAction();
    const empty = '';

    test('handles empty', () => {
        expect(strip(undefined, action)).toBe(empty);
        expect(strip(null, action)).toBe(empty);
        expect(strip('', action)).toBe(empty);
    });

    test('strips keyword', () => {
        expect(strip(action.keyword, action)).toBe(empty);
    });
});

describe('OmniBox stripLastToken', () => {
    const parser = OmniBox.stripLastToken;
    const empty = '';
    test('handles empty', () => {
        expect(parser(undefined)).toBe(empty);
        expect(parser(null)).toBe(empty);
        expect(parser('')).toBe(empty);
    });

    test('handles last space', () => {
        expect(parser(' ')).toEqual(' ');
        expect(parser('filter ')).toEqual('filter ');
        expect(parser('filter "Molecule Set" ')).toEqual('filter "Molecule Set" ');
    });

    test('handles double quotes', () => {
        expect(parser('"')).toEqual('');
        expect(parser('""')).toEqual('""');
        expect(parser('"" j')).toEqual('"" ');
        expect(parser('"" "j')).toEqual('"" ');
        expect(parser('""   j')).toEqual('""   ');
        expect(parser('""   j"')).toEqual('""   j');
    });
});

describe('OmniBox tokenizer', () => {
    const tokenizer = OmniBox.defaultTokenizer;
    const emptyArray = [];
    test('handles empty', () => {
        expect(tokenizer(undefined)).toEqual(emptyArray);
        expect(tokenizer(null)).toEqual(emptyArray);
        expect(tokenizer('')).toEqual(emptyArray);
    });

    test('parses double quotes', () => {
        expect(tokenizer('"')).toEqual(emptyArray);
        expect(tokenizer('""')).toEqual(emptyArray);
        expect(tokenizer(' """')).toEqual(emptyArray);
        expect(tokenizer('"""" ')).toEqual(emptyArray);
        expect(tokenizer(' """"" ')).toEqual(emptyArray);

        expect(tokenizer('the arsonist had "oddly" shaped feet')).toEqual([
            'the',
            'arsonist',
            'had',
            'oddly',
            'shaped',
            'feet',
        ]);

        expect(tokenizer('Mary sells "sea shells" down by the "sea shore"')).toEqual([
            'Mary',
            'sells',
            'sea shells',
            'down',
            'by',
            'the',
            'sea shore',
        ]);

        expect(tokenizer('filter "Molecule Count" > -9')).toEqual(['filter', 'Molecule Count', '>', '-9']);
    });
});
