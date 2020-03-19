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
        const { model } = this.props;
        const { offset, maxRows, rowCount } = model;
        let message = '';

        if (model.rowCount !== undefined) {
            const min = offset !== rowCount ? offset + 1 : offset;
            let max = offset + maxRows;

            message = `${min} - `;

            if (max > rowCount) {
                max = rowCount;
            }

            message += `${max}`;

            if (max !== rowCount) {
                message += ` of ${rowCount}`;
            }
        }

        return (
            <div className="pagination-info">
                {message}
            </div>
        );
    }
}

class PageSelector extends PureComponent<RequiresModel> {
    render() {
        const { model, actions } = this.props;
        const isLoading = model.isLoading();

        return (
            <Tip caption="Current Page">
                <DropdownButton id={`current-page-drop-${model.id}`} pullRight title={model.getCurrentPage()}>
                    <MenuItem header>Jump To</MenuItem>

                    <MenuItem
                        key={'first'}
                        disabled={isLoading || model.isFirstPage()}
                        onClick={() => actions.loadFirstPage(model.id)}
                    >
                        First Page
                    </MenuItem>

                    <MenuItem
                        key={'last'}
                        disabled={isLoading || model.isLastPage()}
                        onClick={() => actions.loadLastPage(model.id)}
                    >
                        Last Page
                    </MenuItem>

                    <MenuItem header>{isLoading || model.getPageCount()} Total Pages</MenuItem>
                </DropdownButton>
            </Tip>
        );
    }
}

class PaginationButtons extends PureComponent<RequiresModel> {
    render() {
        const { model, actions } = this.props;
        const isLoading = model.isLoading();

        return (
            <ButtonGroup>
                <PagingButton
                    disabled={isLoading || model.isFirstPage()}
                    iconClass="fa-chevron-left"
                    tooltip="Previous Page"
                    onClick={() => actions.loadPreviousPage(model.id)}
                />

                <PageSelector model={model} actions={actions} />

                <PagingButton
                    disabled={isLoading || model.isLastPage()}
                    iconClass="fa-chevron-right"
                    tooltip="Next Page"
                    onClick={() => actions.loadNextPage(model.id)}
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

        let grid;

        if (model.orderedRows !== undefined) {
            const data = model.orderedRows.map(i => model.rows[i]);
            const messages: List<Map<string, string>> = fromJS(model.messages);
            const columns = List(model.getDisplayColumns());
            grid = <Grid calcWidths condensed gridId={model.id} messages={messages} columns={columns} data={data} />;
        }

        return (
            <div className="grid-panel">
                <div className="grid-panel__bar">
                    <div className="grid-panel__bar-left">
                        <div className="grid-bar__section" />
                    </div>

                    <div className="grid-panel__bar-right">
                        <div className="grid-bar__section">
                            <PaginationInfo model={model} actions={actions} />
                            <PaginationButtons model={model} actions={actions} />
                            {pageSizeSelector}
                            {viewSelector}
                        </div>
                    </div>
                </div>

                <div className="grid-panel__info-bar">
                    {/* Loading State and Selection Status */}
                    {model.isLoading() && <LoadingSpinner />}
                </div>

                <div className="grid-panel__grid">
                    {grid}
                </div>
            </div>
        );
    }
}
