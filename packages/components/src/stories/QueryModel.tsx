import React, { PureComponent } from 'react';
import { storiesOf } from '@storybook/react';
import { QueryModel } from '../QueryModel/QueryModel';
import { SchemaQuery } from '..';
import { GridPanel, GridPanelWithModel } from '../QueryModel/GridPanel';
import { QueryConfigMap } from '../QueryModel/withQueryModels';

storiesOf('QueryModel', module)
    .add('GridPanel', () => {
        const queryConfigs: QueryConfigMap = {
            'mixtures': {
                schemaQuery: SchemaQuery.create('exp.data', 'mixturespaging'),
            },
        };

        return (
            <div style={{marginTop: '2em'}}>
                <GridPanelWithModel queryConfigs={queryConfigs} />
            </div>
        );
    });
