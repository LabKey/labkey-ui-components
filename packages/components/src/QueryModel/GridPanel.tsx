import React, { PureComponent } from 'react';
import { QueryModel } from './QueryModel';
import { Actions } from './withQueryModels';
import { getOrDefault } from './utils';
import { Alert, Grid, LoadingSpinner, Tip } from '..';
import { fromJS, List, Map } from 'immutable';
import { PagingButton } from '../components/gridbar/QueryGridPaging';
import { ButtonGroup, DropdownButton, MenuItem } from 'react-bootstrap';

interface Props {
    model: QueryModel;
    actions: Actions;
    isPaged?: boolean;
    showViewSelector?: boolean;
}

interface RequiresModel {
    model: QueryModel;
}

class PaginationInfo extends PureComponent<RequiresModel> {
    render() {
        const { offset, maxRows, rowCount } = this.props.model;
        let max = offset + maxRows;

        if (max > rowCount) {
            max = rowCount;
        }

        return (
            <div className="pagination-info">
                {offset + 1} - {max} of {rowCount}
            </div>
        );
    }
}

class Pagination extends PureComponent<RequiresModel> {
    render() {
        const { id, offset, maxRows, rowCount } = this.props.model;
        const lastPageNumber = maxRows && maxRows > 0 ? Math.ceil(rowCount / maxRows) : 1;
        const currentPage = offset > 0 ? Math.floor(rowCount / offset) + 1 : 1;
        const prevDisabled = offset === 0;
        const nextDisabled = (offset + maxRows) >= rowCount;
        const prevIcon = 'fa-chevron-left';
        const nextIcon = 'fa-chevron-right';

        return (
            <ButtonGroup>
                {/* TODO: prev onClick */}
                <PagingButton disabled={prevDisabled} iconClass={prevIcon} tooltip={"Previous Page"} onClick={() => {}}/>
                <Tip caption="Current Page">
                    <DropdownButton id={`current-page-drop-${id}`} pullRight title={currentPage}>
                        <MenuItem header>Jump To</MenuItem>

                        {/* TODO: first onClick */}
                        <MenuItem key={'first'} disabled onClick={() => {}}>
                            First Page
                        </MenuItem>

                        {/* TODO: last onClick */}
                        <MenuItem key={'last'} disabled onClick={() => {}}>
                            Last Page
                        </MenuItem>

                        <MenuItem header>{lastPageNumber} Total Pages</MenuItem>
                    </DropdownButton>
                </Tip>

                {/* TODO: next onClick */}
                <PagingButton disabled={nextDisabled} iconClass={nextIcon} tooltip={"Next Page"} onClick={() => {}}/>
            </ButtonGroup>
        );
    }
}

export class GridPanel extends PureComponent<Props> {
    static defaultProps = {
        isPaged: true,
        showViewSelector: true,
    };

    componentDidMount(): void {
        const { model, actions } = this.props;
        actions.loadModel(model.id);
    }

    render() {
        const { model } = this.props;

        if (model.error !== undefined) {
            return <Alert>{model.error ? model.error : 'Something went wrong while loading data.'}</Alert>
        }

        const pageSizeSelector = undefined;
        const viewSelector = undefined;
        let grid;

        if (model.isLoading()) {
            grid = <LoadingSpinner />;
        } else {
            const data = model.orderedRows.map(i => model.rows[i]);
            const messages: List<Map<string, string>> = fromJS(model.messages);
            const columns = List(model.getDisplayColumns());
            grid = <Grid calcWidths condensed gridId={model.id} messages={messages} columns={columns} data={data} />;
        }

        return (
            <div className={"grid-panel"}>
                <div className={"grid-panel__bar"}>
                    <div className={"grid-panel__bar-left"} />

                    <div className={"grid-panel__bar-right"}>
                        <PaginationInfo model={model} />
                        <Pagination model={model} />
                        {pageSizeSelector}
                        {viewSelector}
                    </div>
                </div>

                <div className={"grid-panel__grid"}>
                    {grid}
                </div>
            </div>
        );
    }
}
