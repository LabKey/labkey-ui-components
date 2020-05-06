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
import React from 'reactn';
import { List, Map } from 'immutable';
import { Query } from '@labkey/api';


import { getLocation, Location, replaceParameters } from '../../util/URL';
import { OmniBox } from '../omnibox/OmniBox';
import { Action, ActionValue, ActionValueCollection } from '../omnibox/actions/Action';
import { FilterAction } from '../omnibox/actions/Filter';
import { SearchAction } from '../omnibox/actions/Search';
import { SortAction } from '../omnibox/actions/Sort';
import { ViewAction } from '../omnibox/actions/View';
import { QueryColumn, QueryGridModel } from '../base/models/model';
import { QueryInfo } from '../..';

/**
 * This is a mapping of actions with their associated URL param. It is keyed by the name of action
 * that a user can supply for a URLBox to the prop 'actions'.
 */
const urlActions = {
    filter: FilterAction,
    search: SearchAction,
    sort: SortAction,
    view: ViewAction,
};

export function isLocationEqual(locationA: Location, locationB: Location): boolean {
    return (
        locationA &&
        locationB &&
        locationA.pathname === locationB.pathname &&
        locationA.search === locationB.search &&
        locationA.query.equals(locationB.query)
    );
}

interface URLBoxProps {
    actions?: string[];
    queryModel: QueryGridModel;
}

interface URLBoxState {
    changeLock?: boolean;
    location: Location;
}

export class URLBox extends React.Component<URLBoxProps, URLBoxState> {
    static defaultProps = {
        // TODO: There is only one consumer of URLBox (QueryGridPanel) and it never overrides this. Does it need to be
        //  a prop? Probably not. We can probably simplify some code in this component if we remove it.
        actions: ['filter', 'search', 'sort', 'view'],
    };

    constructor(props: URLBoxProps) {
        // @ts-ignore // see https://github.com/CharlesStover/reactn/issues/126
        super(props);

        this.state = {
            changeLock: false,
            location: getLocation(),
        };
    }

    shouldComponentUpdate(nextProps: URLBoxProps, nextState: URLBoxState): boolean {
        return !nextState.changeLock && !isLocationEqual(this.state.location, getLocation());
    }

    onOmniBoxChange = (actionValueCollection: ActionValueCollection[], boxActions: Action[]) => {
        const queryModel = this.getQueryModel();
        const location = getLocation();

        const params = Map<string, string>().asMutable();

        console.log('Action Values:')
        if (actionValueCollection.length > 0) {
            for (let i = 0; i < actionValueCollection.length; i++) {
                const av = actionValueCollection[i];
                console.log(av.action.keyword, av.values);
                const actionParams = actionValueCollection[i].action.buildParams(actionValueCollection[i].values);
                for (let p = 0; p < actionParams.length; p++) {
                    params.set(
                        encodeURIComponent(actionParams[p].paramKey),
                        encodeURIComponent(actionParams[p].paramValue)
                    );
                }
            }
        }

        if (location && location.query) {
            location.query.map((value, key) => {
                for (let i = 0; i < boxActions.length; i++) {
                    if (!params.has(key) && boxActions[i].matchParam(key, value)) {
                        params.set(key, undefined);
                    }
                }
            });
        }

        // TODO: Find a better way to clear paging upon dependent updates.  Should paging be a filter?
        if (params.size > 0) {
            params.set(queryModel.urlPrefix ? queryModel.urlPrefix + '.p' : 'p', undefined);
        }

        // TODO: This is a overly simplified mechanism for suppressing unwanted updates. Figure out a better model
        //  for piping URL updates
        // TODO: Also this doesn't do what you think it does. setState is not atomic unless you use the callback
        //  version of it. It is entirely plausible that changeLock is still false, by the time we call updateURL, and
        //  even by the time we set changeLock to false again.
        this.setState({
            changeLock: true,
        });

        replaceParameters(location, params.asImmutable());

        this.setState({
            changeLock: false,
            location: getLocation(),
        });
    };

    mapParamsToActionValues = (): { actions: Action[]; values: ActionValue[] } => {
        const queryModel = this.getQueryModel();
        const location = getLocation();
        const urlPrefix = queryModel ? queryModel.urlPrefix : undefined;
        const queryInfo = queryModel ? queryModel.queryInfo : undefined;

        const actions: Action[] = [];
        const actionValues = [];
        const actionsProp = this.props.actions;

        // setup known URL actions
        for (let i = 0; i < actionsProp.length; i++) {
            if (actionsProp[i].toLowerCase() in urlActions) {
                const actionName = actionsProp[i].toLowerCase();
                if (actionName === ViewAction.NAME && queryInfo) {
                    const { views } = queryInfo;
                    if (
                        !queryModel.showViewSelector ||
                        (views && views.filter(v => !v.name.startsWith('~~')).size === 0)
                    )
                        continue;
                }

                const urlAction = urlActions[actionName];
                actions.push(new urlAction(urlPrefix, this.getColumns, this.getQueryInfo));
            }
        }

        // match each parameter against an action
        if (location && location.query) {
            location.query.map((value: any, key) => {
                let paramValues: string[];

                if (value instanceof Array) {
                    paramValues = value;
                } else {
                    paramValues = [value];
                }

                for (let a = 0; a < actions.length; a++) {
                    for (let p = 0; p < paramValues.length; p++) {
                        const decodedParamVals = decodeURIComponent(paramValues[p]);
                        if (actions[a].matchParam(key, decodedParamVals)) {
                            const values = actions[a].parseParam(key, decodedParamVals, queryModel.getAllColumns());

                            for (let v = 0; v < values.length; v++) {
                                if (typeof values[v] === 'string') {
                                    actionValues.push({
                                        action: actions[a],
                                        value: values[v],
                                    });
                                } else {
                                    actionValues.push(
                                        Object.assign({}, values[v], {
                                            action: actions[a],
                                        })
                                    );
                                }
                            }
                        }
                    }
                }
            });
        }

        return {
            actions,
            values: actionValues,
        };
    };

    getQueryModel = (): QueryGridModel => {
        const { queryModel } = this.props;

        // need to access this.global directly to connect this component to the re-render cycle
        return queryModel ? this.global.QueryGrid_models.get(queryModel.getId()) : undefined;
    };

    getColumns = (all = false): List<QueryColumn> => {
        const model = this.getQueryModel();
        return all ? model.getAllColumns() : model.getDisplayColumns();
    };

    getQueryInfo = (): QueryInfo => {
        return this.getQueryModel().queryInfo;
    };

    getSelectDistinctOptions = (column: string): Query.SelectDistinctOptions => {
        const model = this.getQueryModel();
        return {
            column,
            containerFilter: model.containerFilter,
            containerPath: model.containerPath,
            schemaName: model.schema,
            queryName: model.query,
            viewName: model.view,
            filterArray: model.getFilters().toJS(),
            parameters: model.queryParameters,
        }
    }

    render() {
        const queryModel = this.getQueryModel();
        const { actions, values } = this.mapParamsToActionValues();

        return (
            <OmniBox
                getColumns={this.getColumns}
                getSelectDistinctOptions={this.getSelectDistinctOptions}
                actions={actions}
                onChange={this.onOmniBoxChange}
                values={values}
                disabled={queryModel && queryModel.isError}
            />
        );
    }
}
