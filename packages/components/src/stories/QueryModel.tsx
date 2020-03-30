import React, { PureComponent } from 'react';
import { storiesOf } from '@storybook/react';
import { Button, MenuItem } from 'react-bootstrap';
import {
    GridPanel,
    GridPanelWithModel,
    InjectedQueryModels,
    ManageDropdownButton,
    QueryConfigMap,
    QueryModel,
    RequiresModelAndActions,
    SchemaQuery,
    withQueryModels,
} from '..';
import './QueryModel.scss';
import { verify } from 'crypto';

class GridPanelButtonsExample extends PureComponent<RequiresModelAndActions> {
    render() {
        return (
            <ManageDropdownButton id={'storymanagebtn'}>
                <MenuItem onClick={() => console.log('Menu Item Clicked')}>
                    Import Data
                </MenuItem>
            </ManageDropdownButton>
        );
    }
}

interface State {
    schemaName?: string;
    queryName?: string;
    viewName?: string;
}

class ChangeableSchemaQueryImpl extends PureComponent<{} & InjectedQueryModels, State> {
    constructor(props) {
        super(props);

        this.state = {
            schemaName: '',
            queryName: '',
            viewName: '',
        };
    }

    onFormChange = (e) => {
        const { name, value } = e.target;
        this.setState(() => ({ [name]: value }));
    };

    applySchemaQuery = () => {
        const { queryModels, actions } = this.props;
        const { model } = queryModels;
        let { schemaName, queryName, viewName } = this.state;
        schemaName = schemaName.trim() || undefined;
        queryName = queryName.trim() || undefined;
        viewName = viewName.trim() || undefined;

        if (schemaName === undefined || queryName === undefined) {
            console.warn('Cannot have empty schemaName or queryName');
            return;
        }

        const schemaQuery = SchemaQuery.create(schemaName, queryName, viewName);

        if (model !== undefined) {
            actions.setSchemaQuery(model.id, schemaQuery);
        } else {
            actions.addModel({ schemaQuery, id: 'model' }, true);
        }
    };

    render() {
        const { queryModels, actions } = this.props;
        const { model } = queryModels;
        const { schemaName, queryName, viewName } = this.state;
        let body = (
            <div>
                Enter a Schema, Query, View
            </div>
        );

        if (model !== undefined) {
            body = <GridPanel actions={actions} model={model} />
        }

        return (
            <div>
                <div className="form-row">
                    <div className="form-row__input">
                        <label htmlFor="schemaName">Schema</label>
                        <input id="schemaName" name="schemaName" type="text" value={schemaName} onChange={this.onFormChange}/>
                    </div>

                    <div className="form-row__input">
                        <label htmlFor="queryName">Query</label>
                        <input id="queryName" name="queryName" type="text" value={queryName} onChange={this.onFormChange}/>
                    </div>

                    <div className="form-row__input">
                        <label htmlFor="viewName">View</label>
                        <input id="viewName" name="viewName" type="text" value={viewName} onChange={this.onFormChange}/>
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
        const queryConfigs: QueryConfigMap = {
            'mixtures': {
                schemaQuery: SchemaQuery.create('exp.data', 'mixturespaging'),
            },
        };

        return (
            <div style={{marginTop: '2em'}}>
                <GridPanelWithModel queryConfigs={queryConfigs} ButtonsComponent={GridPanelButtonsExample} />
            </div>
        );
    })
    .add('Changeable SchemaQuery', () => {
        return <ChangeableSchemaQuery />;
    });
