import React, { ReactNode } from 'react';

import { List } from 'immutable';

import { Checkbox } from 'react-bootstrap';

import { Grid, GridColumn } from '../../..';
import { headerCell } from '../../renderers';

import { GRID_SELECTION_INDEX } from '../../constants';

import { compareStringsAlphabetically } from './propertiesUtil';

import { SummaryGrid } from './models';

interface DomainPropertiesGridProps {
    initGridData: List<any>;
    gridColumns: List<GridColumn | SummaryGrid>;
    search: string;
    selectAll: boolean;
    toggleSelectAll: () => void;
}

interface DomainPropertiesGridState {
    gridData: List<any>;
    search: string;
}

export class DomainPropertiesGrid extends React.PureComponent<DomainPropertiesGridProps, DomainPropertiesGridState> {
    constructor(props: DomainPropertiesGridProps) {
        super(props);

        this.state = {
            gridData: this.props.initGridData,
            search: this.props.search,
        };
    }

    componentDidUpdate(prevProps: Readonly<DomainPropertiesGridProps>): void {
        const { gridData } = this.state;

        const prevSearch = prevProps.search;
        const newSearch = this.props.search;
        const prevGridData = prevProps.initGridData;
        const newGridData = this.props.initGridData;

        // When new field added
        if (prevGridData.size < newGridData.size) {
            this.setState({ gridData: gridData.push(newGridData.get(-1)) });
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

    uponRowDelete = (): void => {
        const { gridData } = this.state;
        const { initGridData } = this.props;

        const updatedGridData = gridData.reduce((updatedGridData, row) => {
            const newRowIndex = initGridData.findIndex(newRow => newRow.get('name') === row.get('name'));
            if (newRowIndex !== -1) {
                return updatedGridData.set(updatedGridData.size, row.set('fieldIndex', newRowIndex));
            } else {
                return updatedGridData;
            }
        }, List());

        this.setState({ gridData: updatedGridData });
    };

    uponFilter = (): void => {
        const { gridData } = this.state;
        const { initGridData } = this.props;

        const updatedGridData = gridData.map(row => {
            const nextRowIndex = initGridData.findIndex(nextRow => nextRow.get('name') === row.get('name'));
            return row.set('visible', initGridData.get(nextRowIndex).get('visible'));
        }) as List<any>;
        this.setState({ gridData: updatedGridData });
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
                this.setState({ gridData: updatedGridData });
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

        this.setState({ gridData: sortedFields });
    };

    headerCell = (column: GridColumn, index: number, columnCount?: number): ReactNode => {
        const { selectAll, toggleSelectAll } = this.props;

        if (column.index === GRID_SELECTION_INDEX) {
            return <Checkbox className="domain-summary-selectAll" checked={selectAll} onChange={toggleSelectAll} />;
        }

        return headerCell(this.sortColumn, column, index, false, true, columnCount);
    };

    render() {
        const { gridColumns } = this.props;
        const { gridData } = this.state;

        const gridDataFiltered = gridData.filter(row => row.get('visible')) as List<any>; // maybe for efficiency we make this its own state thing?

        return (
            <>
                <Grid data={gridDataFiltered} columns={gridColumns} headerCell={this.headerCell} />
            </>
        );
    }
}
