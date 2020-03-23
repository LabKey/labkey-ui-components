import React, { PureComponent } from 'react';
import { storiesOf } from '@storybook/react';
import { QueryModel } from '../QueryModel/QueryModel';
import { ManageDropdownButton, SchemaQuery, SelectionMenuItem } from '..';
import { GridPanel, GridPanelWithModel } from '../QueryModel/GridPanel';
import { QueryConfigMap, RequiresModelAndActions } from '../QueryModel/withQueryModels';
import { MenuItem } from 'react-bootstrap';

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
    });
