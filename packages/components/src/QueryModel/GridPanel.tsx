import React, { PureComponent } from 'react';
import { QueryModel } from './QueryModel';
import { Actions } from './withQueryModels';
import { Alert, Grid, LoadingSpinner } from '..';
import { fromJS, List } from 'immutable';
import { PaginationButtons, PaginationInfo } from './Pagination';
import { PageSizeSelector } from './PageSizeSelector';
import { ViewSelector } from './ViewSelector';

interface Props {
    model: QueryModel;
    actions: Actions;
    isPaged?: boolean;
    showViewSelector?: boolean;
    hideEmptyViewSelector?: boolean;
    pageSizes?: number[];
}

export class GridPanel extends PureComponent<Props> {
    static defaultProps = {
        isPaged: true,
        showViewSelector: true,
        hideEmptyViewSelector: false,
    };

    componentDidMount(): void {
        const { model, actions } = this.props;
        actions.loadModel(model.id);
    }

    render() {
        const { model, actions, isPaged, showViewSelector, hideEmptyViewSelector, pageSizes } = this.props;
        const { id, error, messages, queryInfo } = model;
        const hasData = model.hasData();
        const paginate = isPaged && hasData;

        if (model.error !== undefined) {
            return <Alert>{error}</Alert>
        }

        let grid;

        if (hasData) {
            grid = (
                <Grid
                    calcWidths
                    condensed
                    gridId={id}
                    messages={fromJS(messages)}
                    columns={List(model.getDisplayColumns())}
                    data={model.getGridData()}
                />
            );
        }

        return (
            <div className="grid-panel">
                <div className="grid-panel__bar">
                    <div className="grid-panel__bar-left">
                        <div className="grid-bar__section" />
                    </div>

                    <div className="grid-panel__bar-right">
                        <div className="grid-bar__section">
                            {paginate && <PaginationInfo model={model} actions={actions} />}
                            {paginate && <PaginationButtons model={model} actions={actions} />}
                            {paginate && <PageSizeSelector model={model} actions={actions} pageSizes={pageSizes} />}
                            {
                                (showViewSelector && queryInfo) &&
                                <ViewSelector
                                    model={model}
                                    actions={actions}
                                    hideEmptyViewSelector={hideEmptyViewSelector}
                                />
                            }
                        </div>
                    </div>
                </div>

                <div className="grid-panel__info">
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
