import React, { PureComponent } from 'react';
import { QueryModel } from './QueryModel';
import { Actions } from './withQueryModels';
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
    actions: Actions;
}

class PaginationInfo extends PureComponent<RequiresModel> {
    render() {
        const { offset, maxRows, rowCount } = this.props.model;
        const min = offset !== rowCount ? offset + 1 : offset;
        let message = `${min} - `;
        let max = offset + maxRows;

        if (max > rowCount) {
            max = rowCount;
        }

        message += `${max}`;

        if (max !== rowCount) {
            message += ` of ${rowCount}`;
        }

        return (
            <div className="pagination-info">
                {message}
            </div>
        );
    }
}

class Pagination extends PureComponent<RequiresModel> {
    loadNextPage = () => {
        const { model, actions } = this.props;
        actions.loadNextPage(model.id);
    };

    loadPreviousPage = () => {
        const { model, actions } = this.props;
        actions.loadPreviousPage(model.id);
    };

    loadFirstPage = () => {
        const { model, actions } = this.props;
        actions.loadFirstPage(model.id);
    };

    loadLastPage = () => {
        const { model, actions } = this.props;
        actions.loadLastPage(model.id);
    };

    render() {
        const { model } = this.props;
        return (
            <ButtonGroup>
                <PagingButton
                    disabled={model.isFirstPage()}
                    iconClass="fa-chevron-left"
                    tooltip="Previous Page"
                    onClick={this.loadPreviousPage}
                />

                <Tip caption="Current Page">
                    <DropdownButton id={`current-page-drop-${model.id}`} pullRight title={model.getCurrentPage()}>
                        <MenuItem header>Jump To</MenuItem>

                        <MenuItem key={'first'} disabled={model.isFirstPage()} onClick={this.loadFirstPage}>
                            First Page
                        </MenuItem>

                        <MenuItem key={'last'} disabled={model.isLastPage()} onClick={this.loadLastPage}>
                            Last Page
                        </MenuItem>

                        <MenuItem header>{model.getPageCount()} Total Pages</MenuItem>
                    </DropdownButton>
                </Tip>

                <PagingButton
                    disabled={model.isLastPage()}
                    iconClass="fa-chevron-right"
                    tooltip="Next Page"
                    onClick={this.loadNextPage}
                />
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
        const { model, actions } = this.props;

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
                        <PaginationInfo model={model} actions={actions} />
                        <Pagination model={model} actions={actions} />
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
