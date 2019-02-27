/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Action, ActionOption, ActionValue, Value } from './Action'

export class SearchAction implements Action {
    iconCls = 'search';
    param = 'q';
    keyword = 'search';
    oneWordLabel = 'search';
    optionalLabel = 'keywords';

    constructor(resolveColumns, urlPrefix: string) {
        if (urlPrefix !== undefined) {
            this.param = [urlPrefix, this.param].join('.');
        }
    }

    completeAction(tokens: Array<string>): Promise<Value> {
        const token = tokens.join(' ');
        return Promise.resolve({
            value: token,
            param: token
        });
    }

    fetchOptions(tokens: Array<string>): Promise<Array<ActionOption>> {
        const token = tokens.join(' ');
        const option: ActionOption = {
            label: `search for "${token}"`,
            value: token,
            appendValue: false,
            selectable: token !== '',
            isComplete: token !== ''
        };

        return Promise.resolve([option]);
    }

    buildParams(actionValues: Array<ActionValue>): Array<{paramKey: string; paramValue: string}> {
        let paramValue = '',
            sep = '';

        actionValues.forEach((actionValue) => {
            paramValue += sep + actionValue.value;
            sep = ';';
        });

        return [{
            paramKey: this.param,
            paramValue
        }];
    }

    matchParam(paramKey: string, paramValue: any): boolean {
        return paramKey && paramKey.toLowerCase() === this.param.toLowerCase();
    }

    parseParam(paramKey: string, paramValue: any): Array<string> | Array<Value> {
        return paramValue.split(';');
    }
}