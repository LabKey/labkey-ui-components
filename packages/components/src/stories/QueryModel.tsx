import React, { PureComponent } from 'react';
import { storiesOf } from '@storybook/react';
import { QueryModel } from '../QueryModel/QueryModel';
import { GridPanel } from '../QueryModel/GridPanel';
import { SchemaQuery } from '..';
import { InjectedQueryModels, QueryConfigMap, withQueryModels } from '../QueryModel/withQueryModels';

type Props = {};

class GridPanelWrapper extends PureComponent<Props & InjectedQueryModels> {
    render() {
        console.log(this.props.queryModels);
        const model = this.props.queryModels.mixtures;
        console.log('GridPanelWrapper - model', model);
        return (
            <div style={{marginTop: '2em'}}>
                <GridPanel model={model} actions={this.props.actions} />
            </div>
        );
    }
}

const GridPanelWithModels = withQueryModels<Props>(GridPanelWrapper);

storiesOf('QueryModel', module)
    .add('GridPanel', () => {
        const queryConfigs: QueryConfigMap = {
            'mixtures': {
                schemaQuery: SchemaQuery.create('exp.data', 'mixturespaging'),
            },
        };
        return <GridPanelWithModels queryConfigs={queryConfigs} />
    });
