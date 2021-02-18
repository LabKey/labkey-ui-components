import React, { ReactNode } from 'react';

import { List } from 'immutable';

import { Checkbox } from 'react-bootstrap';

import {DomainDesign, Grid, GridColumn, IFieldChange} from '../../..';
import { headerCell } from '../../renderers';

import { GRID_SELECTION_INDEX } from '../../constants';

import { compareStringsAlphabetically } from './propertiesUtil';

import { DomainPropertiesGridColumn } from './models';

interface DomainPropertiesGridProps {
    initGridData: List<any>;
    gridColumns: List<GridColumn | DomainPropertiesGridColumn>;
    domain: DomainDesign;
    actions: {
        toggleSelectAll: () => void;
        scrollFunction: (i: number) => void;
        onFieldsChange: (changes: List<IFieldChange>, index: number, expand: boolean) => void;
    };
    search: string;
    selectAll: boolean;
    appPropertiesOnly?: boolean;
}

interface DomainPropertiesGridState {
    gridData: List<any>;
    gridColumns?: List<GridColumn | DomainPropertiesGridColumn>;
    visibleGridData: List<any>;
    search: string;
}

export class DomainPropertiesGrid extends React.PureComponent<DomainPropertiesGridProps, DomainPropertiesGridState> {
    constructor(props: DomainPropertiesGridProps) {
        super(props);
        const { domain, actions } = this.props;
        const { onFieldsChange, scrollFunction } = actions;

        this.state = {
            // gridData: domain.getGridData(),
            // gridColumns: domain.getGridColumns(onFieldsChange, scrollFunction, domain.domainKindName),
            gridData: this.props.initGridData,
            visibleGridData: this.getVisibleGridData(this.props.initGridData),
            search: this.props.search,
        };
    }

    componentDidUpdate(prevProps: Readonly<DomainPropertiesGridProps>): void {
        const prevSearch = prevProps.search;
        const newSearch = this.props.search;
        const prevGridData = prevProps.initGridData;
        const newGridData = this.props.initGridData;

        // When new field added
        if (prevGridData.size < newGridData.size) {
            this.uponRowAdd(newGridData);
        // When fields are deleted
        } else if (prevGridData.size > newGridData.size) {
            this.uponRowDelete();
        // When search is updated
        } else if (prevSearch !== newSearch) {
            this.uponFilter();
        // If selection updated
        } else {
            this.uponRowSelection();
        }
    }

    getVisibleGridData = (gridData: List<any>): List<any> => {
        return gridData.filter(row => row.get('visible')) as List<any>;
    }

    uponRowAdd = (newGridData: List<any>): void => {
        const { gridData, visibleGridData } = this.state;
        const updatedGridData = gridData.push(newGridData.get(-1));
        const updatedVisibleGridData = visibleGridData.push(newGridData.get(-1));

        this.setState({ gridData: updatedGridData, visibleGridData: updatedVisibleGridData });
    }

    uponRowDelete = (): void => {
        const { gridData } = this.state;
        const { initGridData } = this.props;

        const updatedGridData = gridData.reduce((updatedGridData, row) => {
            const newRowIndex = initGridData.findIndex(newRow => newRow.get('fieldIndex') === row.get('fieldIndex'));
            return (newRowIndex !== -1)
                ? updatedGridData.set(updatedGridData.size, row.set('fieldIndex', newRowIndex))
                : updatedGridData;
        }, List());

        const visibleGridData = this.getVisibleGridData(updatedGridData);

        this.setState({ gridData: updatedGridData, visibleGridData });
    };

    uponFilter = (): void => {
        const { gridData } = this.state;
        const { initGridData } = this.props;

        const updatedGridData = gridData.map(row => {
            const nextRowIndex = initGridData.findIndex(nextRow => nextRow.get('fieldIndex') === row.get('fieldIndex'));
            return row.set('visible', initGridData.get(nextRowIndex).get('visible'));
        }) as List<any>;
        const visibleGridData = this.getVisibleGridData(updatedGridData);

        this.setState({ gridData: updatedGridData, visibleGridData });
    };

    uponRowSelection = (): void => {
        const { gridData } = this.state;
        const { initGridData } = this.props;

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
        const { gridData } = this.state;

        const sortedFields = gridData.sort((field1, field2) => {
            const col = column.index;

            return compareStringsAlphabetically(field1.get(col), field2.get(col), direction);
        }) as List<any>;
        const updatedVisibleGridData = this.getVisibleGridData(sortedFields);

        this.setState({ gridData: sortedFields, visibleGridData: updatedVisibleGridData });
    };

    headerCell = (column: GridColumn, index: number, columnCount?: number): ReactNode => {
        const { selectAll, actions } = this.props;
        if (column.index === GRID_SELECTION_INDEX) {
            return <Checkbox className="domain-summary-selectAll" checked={selectAll} onChange={actions.toggleSelectAll} />;
        }

        return headerCell(this.sortColumn, column, index, false, true, columnCount);
    };

    render() {
        const { gridColumns } = this.props;
        const { visibleGridData } = this.state;

        return <Grid data={visibleGridData} columns={gridColumns} headerCell={this.headerCell} condensed={true} calcWidths={true} className="domain-summary-container" />;
    }
}
