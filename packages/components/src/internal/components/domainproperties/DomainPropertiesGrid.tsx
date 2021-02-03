import React, { ReactNode } from 'react';

import { List } from 'immutable';

import { Checkbox } from 'react-bootstrap';

import { Grid, GridColumn } from '../../..';
import { headerCell } from '../../renderers';

import {GRID_NAME_INDEX, GRID_SELECTION_INDEX} from '../../constants';

import { compareStringsAlphabetically } from './propertiesUtil';

import { SummaryGrid } from './models';

interface DomainPropertiesGridProps {
    initGridData: List<any>;
    gridColumns: List<GridColumn | SummaryGrid>;
    search: string;
    selectAll: boolean;
    toggleSelectAll: () => void;
    scrollFunction: (i: number) => void;
}

interface DomainPropertiesGridState {
    gridData: List<any>;
    visibleGridData: List<any>;
    search: string;
}

export class DomainPropertiesGrid extends React.PureComponent<DomainPropertiesGridProps, DomainPropertiesGridState> {
    constructor(props: DomainPropertiesGridProps) {
        super(props);

        this.state = {
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

        console.log("initGridData", initGridData.toJS());
        console.log("gridData", gridData.toJS());

        const updatedGridData = gridData.reduce((updatedGridData, row) => {
            const newRowIndex = initGridData.findIndex(newRow => newRow.get('name') === row.get('name'));
            return (newRowIndex !== -1)
                ? updatedGridData.set(updatedGridData.size, row.set('fieldIndex', newRowIndex))
                : updatedGridData;
        }, List());

        console.log("updatedGridData", updatedGridData.toJS());
        const visibleGridData = this.getVisibleGridData(updatedGridData);

        this.setState({ gridData: updatedGridData, visibleGridData });
    };

    uponFilter = (): void => {
        const { gridData } = this.state;
        const { initGridData } = this.props;

        const updatedGridData = gridData.map(row => {
            const nextRowIndex = initGridData.findIndex(nextRow => nextRow.get('name') === row.get('name'));
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

            const newRowIndex = initGridData.findIndex(newRow => newRow.get('name') === row.get('name'));
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
        const { selectAll, toggleSelectAll } = this.props;
        if (column.index === GRID_SELECTION_INDEX) {
            return <Checkbox className="domain-summary-selectAll" checked={selectAll} onChange={toggleSelectAll} />;
        }

        if (column.index === GRID_NAME_INDEX) {
            return "Name";
        }

        return headerCell(this.sortColumn, column, index, false, true, columnCount);
    };

    render() {
        const { gridColumns } = this.props;
        const { visibleGridData, gridData } = this.state;

        // console.log('initGridData', this.props.initGridData.toJS());
        // console.log('gridColumns', this.props.gridColumns.toJS())

        return (
            <>
                <Grid data={visibleGridData} columns={gridColumns} headerCell={this.headerCell} condensed={true} calcWidths={true} />
            </>
        );
    }
}
