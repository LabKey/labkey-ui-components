import React, {
    ChangeEvent,
    FunctionComponent,
    PureComponent,
    ReactElement,
} from 'react';
import { storiesOf } from '@storybook/react';
import { Button, MenuItem } from 'react-bootstrap';

import {
    GridPanel,
    GridPanelWithModel,
    InjectedQueryModels,
    ManageDropdownButton,
    QueryConfigMap,
    RequiresModelAndActions,
    SchemaQuery,
    withQueryModels,
} from '..';
import './QueryModel.scss';
import { createMemoryHistory, Route, Router, WithRouterProps } from 'react-router';

class GridPanelButtonsExample extends PureComponent<RequiresModelAndActions> {
    render() {
        return (
            <ManageDropdownButton id="storymanagebtn">
                <MenuItem onClick={() => console.log('Menu Item Clicked')}>Import Data</MenuItem>
            </ManageDropdownButton>
        );
    }
}

interface State {
    schemaName?: string;
    queryName?: string;
}

class ChangeableSchemaQueryImpl extends PureComponent<{} & InjectedQueryModels, State> {
    constructor(props) {
        super(props);

        this.state = {
            schemaName: '',
            queryName: '',
        };
    }

    onFormChange = e => {
        const { name, value } = e.target;
        this.setState(() => ({ [name]: value }));
    };

    applySchemaQuery = () => {
        const { queryModels, actions } = this.props;
        const { model } = queryModels;
        let { schemaName, queryName } = this.state;
        schemaName = schemaName.trim() || undefined;
        queryName = queryName.trim() || undefined;

        if (schemaName === undefined || queryName === undefined) {
            console.warn('Cannot have empty schemaName or queryName');
            return;
        }

        const schemaQuery = SchemaQuery.create(schemaName, queryName);

        if (model !== undefined) {
            actions.setSchemaQuery(model.id, schemaQuery);
        } else {
            actions.addModel({ schemaQuery, id: 'model' }, true);
        }
    };

    render() {
        const { queryModels, actions } = this.props;
        const { model } = queryModels;
        const { schemaName, queryName } = this.state;
        let body = <div>Enter a Schema, Query, View</div>;

        if (model !== undefined) {
            body = <GridPanel actions={actions} model={model} asPanel={false} />;
        }

        return (
            <div className="query-model-example">
                <div className="form-row">
                    <div className="form-row__input">
                        <label htmlFor="schemaName">Schema</label>
                        <input
                            id="schemaName"
                            name="schemaName"
                            type="text"
                            value={schemaName}
                            onChange={this.onFormChange}
                        />
                    </div>

                    <div className="form-row__input">
                        <label htmlFor="queryName">Query</label>
                        <input
                            id="queryName"
                            name="queryName"
                            type="text"
                            value={queryName}
                            onChange={this.onFormChange}
                        />
                    </div>

                    <div className="form-row__input">
                        <Button onClick={this.applySchemaQuery}>Apply</Button>
                    </div>
                </div>

                {body}
            </div>
        );
    }
}

const ChangeableSchemaQuery = withQueryModels<{}>(ChangeableSchemaQueryImpl);

storiesOf('QueryModel', module)
    .add('GridPanel', () => {
        const history = createMemoryHistory();

        const ExampleGrid: FunctionComponent<WithRouterProps> = (props: WithRouterProps): ReactElement => {
            const { location, router } = props;
            const queryString = Object.keys(location.query)
                .map(key => {
                    const value = location.query[key];
                    return key + '=' + value;
                })
                .join('&');
            const queryConfigs: QueryConfigMap = {
                mixtures: {
                    bindURL: true,
                    schemaQuery: SchemaQuery.create('exp.data', 'mixturespaging'),
                    urlPrefix: 'mixtures',
                },
            };

            const onQueryChange = (evt: ChangeEvent<HTMLInputElement>): void => {
                const query = {};
                evt.target.value.split('&').forEach(segment => {
                    const [ key, value ] = segment.split('=');
                    query[key] = value;
                    router.replace({...location, query });
                });
            };

            return (
                <div className="query-model-example">
                    <div>
                        <label>URL Query Params: </label>
                        <input style={{ width: '800px' }} value={queryString} onChange={onQueryChange} />
                    </div>
                    <GridPanelWithModel
                        ButtonsComponent={GridPanelButtonsExample}
                        title="Mixtures"
                        queryConfigs={queryConfigs}
                    />
                </div>
            );
        };

        return (
            <Router history={history}>
                <Route path="/" component={ExampleGrid} />
            </Router>
        );
    })
    .add('Minimal GridPanel', () => {
        const queryConfigs: QueryConfigMap = {
            mixtures: {
                schemaQuery: SchemaQuery.create('exp.data', 'mixturespaging'),
            },
        };

        return (
            <div className="query-model-example">
                <GridPanelWithModel
                    queryConfigs={queryConfigs}
                    asPanel={false}
                    showOmniBox={false}
                    showButtonBar={false}
                    allowSelections={false}
                />
            </div>
        );
    })
    .add('Bad Query Info', () => {
        const queryConfigs: QueryConfigMap = {
            mixtures: {
                schemaQuery: SchemaQuery.create('i.do.not.exist', 'IAmNonExistent'),
            },
        };

        return (
            <div className="query-model-example">
                <GridPanelWithModel title="Bad QueryInfo" queryConfigs={queryConfigs}/>
            </div>
        );
    })
    .add('Bad Query', () => {
        const queryConfigs: QueryConfigMap = {
            mixtures: {
                schemaQuery: SchemaQuery.create('exp.data', 'mixturesbad'),
            },
        };

        return (
            <div className="query-model-example">
                <GridPanelWithModel title="Bad Query" queryConfigs={queryConfigs}/>
            </div>
        );
    })
    .add('Changeable SchemaQuery', () => {
        return <ChangeableSchemaQuery />;
    });
