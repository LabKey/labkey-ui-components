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
import { List } from 'immutable';

import { QueryColumn } from '../../base/models/model';

import { Action, ActionOption, ActionValue, Value } from './Action';

export class SearchAction implements Action {
    isDefaultAction = true;
    iconCls = 'search';
    param = 'q';
    keyword = 'search';
    oneWordLabel = 'search';
    optionalLabel = 'keywords';

    constructor(urlPrefix: string) {
        if (urlPrefix !== undefined) {
            this.param = [urlPrefix, this.param].join('.');
        }
    }

    completeAction(tokens: string[]): Promise<Value> {
        const token = tokens.join(' ');
        // @ts-ignore
        return Promise.resolve({
            value: token,
            param: token,
        });
    }

    fetchOptions(tokens: string[]): Promise<ActionOption[]> {
        const token = tokens.join(' ');
        const option: ActionOption = {
            label: `search for "${token}"`,
            value: token,
            appendValue: false,
            selectable: token !== '',
            isComplete: token !== '',
        };

        return Promise.resolve([option]);
    }

    buildParams(actionValues: ActionValue[]): Array<{ paramKey: string; paramValue: string }> {
        let paramValue = '',
            sep = '';

        actionValues.forEach(actionValue => {
            paramValue += sep + actionValue.value;
            sep = ';';
        });

        return [
            {
                paramKey: this.param,
                paramValue,
            },
        ];
    }

    matchParam(paramKey: string, paramValue: any): boolean {
        return paramKey && paramKey.toLowerCase() === this.param.toLowerCase();
    }

    parseParam(paramKey: string, paramValue: any, columns: List<QueryColumn>): string[] | Value[] {
        return paramValue.split(';');
    }
}
