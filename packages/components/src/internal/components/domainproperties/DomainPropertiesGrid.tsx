import React, { ReactNode } from 'react';
import { List } from 'immutable';

import { HeaderCellDropdown } from '../../renderers';

import { GRID_SELECTION_INDEX } from '../../constants';

import { GridColumn } from '../base/models/GridColumn';

import { Grid } from '../base/Grid';

import { DomainDesignerCheckbox } from './DomainDesignerCheckbox';

import { compareStringsAlphabetically } from './propertiesUtil';

import { DomainDesign, DomainPropertiesGridColumn, IFieldChange } from './models';

interface DomainPropertiesGridProps {
    actions: {
        onFieldsChange: (changes: List<IFieldChange>, index: number, expand: boolean) => void;
        scrollFunction: (i: number) => void;
        toggleSelectAll: () => void;
    };
    appPropertiesOnly?: boolean;
    domain: DomainDesign;
    hasOntologyModule: boolean;
    search: string;
    selectAll: boolean;
    showFilterCriteria: boolean;
}

interface DomainPropertiesGridState {
    gridColumns: List<GridColumn | DomainPropertiesGridColumn>;
    gridData: List<any>;
    visibleGridData: List<any>;
}

export class DomainPropertiesGrid extends React.PureComponent<DomainPropertiesGridProps, DomainPropertiesGridState> {
    constructor(props: DomainPropertiesGridProps) {
        super(props);
        const { domain, actions, appPropertiesOnly, hasOntologyModule, showFilterCriteria } = this.props;
        const { onFieldsChange, scrollFunction } = actions;
        const { domainKindName } = domain;
        const gridData = domain.getGridData(appPropertiesOnly, hasOntologyModule, showFilterCriteria);

        // TODO: Maintain hash of fieldIndex : gridIndex on state in order to make delete and filter run in N rather than N^2 time.
        this.state = {
            gridData,
            gridColumns: domain.getGridColumns(
                onFieldsChange,
                scrollFunction,
                domainKindName,
                appPropertiesOnly,
                hasOntologyModule,
                showFilterCriteria
            ),
            visibleGridData: this.getVisibleGridData(gridData),
        };
    }

    componentDidUpdate(prevProps: Readonly<DomainPropertiesGridProps>): void {
        const { appPropertiesOnly, domain, hasOntologyModule, search, showFilterCriteria } = this.props;
        const prevGridData = prevProps.domain.getGridData(appPropertiesOnly, hasOntologyModule, showFilterCriteria);
        const newGridData = domain.getGridData(appPropertiesOnly, hasOntologyModule, showFilterCriteria);

        if (prevGridData.size < newGridData.size) {
            // When new field added
            this.uponRowAdd(newGridData);
        } else if (prevGridData.size > newGridData.size) {
            // When fields are deleted
            this.uponRowDelete();
        } else if (prevProps.search !== search) {
            // When search is updated
            this.uponFilter();
        } else {
            // If selection updated
            this.uponRowSelection();
        }
    }

    getVisibleGridData = (gridData: List<any>): List<any> => {
        return gridData.filter(row => row.get('visible')).toList();
    };

    uponRowAdd = (newGridData: List<any>): void => {
        const { gridData, visibleGridData } = this.state;
        const updatedGridData = gridData.push(newGridData.get(-1));
        const updatedVisibleGridData = visibleGridData.push(newGridData.get(-1));

        this.setState({ gridData: updatedGridData, visibleGridData: updatedVisibleGridData });
    };

    uponRowDelete = (): void => {
        const { appPropertiesOnly, domain, hasOntologyModule, showFilterCriteria } = this.props;
        const { gridData } = this.state;
        const initGridData = domain.getGridData(appPropertiesOnly, hasOntologyModule, showFilterCriteria);

        // Handle bug that occurs if multiple fields have the same name
        const replaceGridData = new Set(gridData.map(row => row.get('name')).toJS()).size !== gridData.size;
        if (replaceGridData) {
            this.setState({ gridData: initGridData, visibleGridData: this.getVisibleGridData(initGridData) });
            return;
        }

        const updatedGridData = gridData.reduce((updatedGridData, row) => {
            const newRowIndex = initGridData.findIndex(newRow => newRow.get('name') === row.get('name'));
            return newRowIndex !== -1
                ? updatedGridData.set(updatedGridData.size, row.set('fieldIndex', newRowIndex))
                : updatedGridData;
        }, List());

        const visibleGridData = this.getVisibleGridData(updatedGridData);

        this.setState({ gridData: updatedGridData, visibleGridData });
    };

    uponFilter = (): void => {
        const { appPropertiesOnly, domain, hasOntologyModule, showFilterCriteria } = this.props;

        this.setState(state => {
            const initGridData = domain.getGridData(appPropertiesOnly, hasOntologyModule, showFilterCriteria);

            const gridData = state.gridData
                .map(row => {
                    const nextRowIndex = initGridData.findIndex(
                        nextRow => nextRow.get('fieldIndex') === row.get('fieldIndex')
                    );
                    return row.set('visible', initGridData.get(nextRowIndex).get('visible'));
                })
                .toList();

            return { gridData, visibleGridData: this.getVisibleGridData(gridData) };
        });
    };

    uponRowSelection = (): void => {
        const { appPropertiesOnly, domain, hasOntologyModule, showFilterCriteria } = this.props;
        const { gridData } = this.state;
        const initGridData = domain.getGridData(appPropertiesOnly, hasOntologyModule, showFilterCriteria);

        for (let i = 0; i < gridData.size; i++) {
            const row = gridData.get(i);
            const rowSelection = row.get('selected');

            const newRowIndex = initGridData.findIndex(newRow => newRow.get('fieldIndex') === row.get('fieldIndex'));
            const newRow = initGridData.get(newRowIndex);
            const newRowSelection = newRow.get('selected');

            if (rowSelection !== newRowSelection) {
                const updatedGridData = gridData.update(i, field => field.set('selected', newRowSelection));
                const visibleGridData = this.getVisibleGridData(updatedGridData);

                this.setState({ gridData: updatedGridData, visibleGridData });
                break;
            }
        }
    };

    sortColumn = (column, direction): void => {
        const { index } = column;

        this.setState(state => {
            const gridData = state.gridData
                .sort((field1, field2) => compareStringsAlphabetically(field1.get(index), field2.get(index), direction))
                .toList();

            return { gridData, visibleGridData: this.getVisibleGridData(gridData) };
        });
    };

    headerCell = (column: GridColumn, index: number, columnCount?: number): ReactNode => {
        const { selectAll, actions } = this.props;
        if (column.index === GRID_SELECTION_INDEX) {
            return (
                <DomainDesignerCheckbox
                    className="domain-summary-selectAll"
                    checked={selectAll}
                    onChange={actions.toggleSelectAll}
                />
            );
        }

        return (
            <HeaderCellDropdown
                column={column}
                columnCount={columnCount}
                handleSort={this.sortColumn}
                i={index}
                selectable={false}
            />
        );
    };

    render() {
        const { visibleGridData, gridColumns } = this.state;

        return <Grid data={visibleGridData} columns={gridColumns} headerCell={this.headerCell} condensed />;
    }
}
