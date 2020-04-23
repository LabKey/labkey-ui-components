import React, { ComponentType, PureComponent } from 'react';
import classNames from 'classnames';
import { fromJS, List } from 'immutable';

import { Alert, Grid, GRID_CHECKBOX_OPTIONS, GridColumn, LoadingSpinner } from '..';

import { GRID_SELECTION_INDEX } from '../components/base/models/constants';

import { headerCell, headerSelectionCell } from '../renderers';

import { InjectedQueryModels, RequiresModelAndActions, withQueryModels } from './withQueryModels';
import { PaginationButtons, PaginationInfo } from './Pagination';
import { PageSizeSelector } from './PageSizeSelector';
import { ViewSelector } from './ViewSelector';
import { ExportMenu } from './ExportMenu';

import { SelectionStatus } from './SelectionStatus';

interface GridPanelProps {
    allowSelections?: boolean;
    allowSorting?: boolean;
    asPanel?: boolean;
    advancedExportOptions?: { [key: string]: string };
    ButtonsComponent?: ComponentType<RequiresModelAndActions>;
    hideEmptyViewSelector?: boolean;
    isPaged?: boolean;
    pageSizes?: number[];
    showExport?: boolean;
    showViewSelector?: boolean;
}

type Props = GridPanelProps & RequiresModelAndActions;

export class GridPanel extends PureComponent<Props> {
    static defaultProps = {
        allowSelections: true,
        allowSorting: true,
        asPanel: true,
        hideEmptyViewSelector: false,
        isPaged: true,
        showExport: true,
        showViewSelector: true,
    };

    componentDidMount(): void {
        const { model, actions, allowSelections } = this.props;
        actions.loadModel(model.id, allowSelections);
    }

    selectRow = (row, event) => {
        const { model, actions } = this.props;
        const checked = event.currentTarget.checked === true;
        // Have to call toJS() on the row because <Grid /> converts rows to Immutable objects.
        actions.selectRow(model.id, checked, row.toJS());
    };

    selectPage = event => {
        const { model, actions } = this.props;
        const checked = event.currentTarget.checked === true && model.selectedState !== GRID_CHECKBOX_OPTIONS.SOME;
        actions.selectPage(model.id, checked);
    };

    sortColumn = (column, direction) => {
        console.log('sort column', column, direction);
    };

    getGridColumns = () => {
        const { allowSelections, model } = this.props;
        const { isLoading, isLoadingSelections } = model;

        if (allowSelections) {
            const selectColumn = new GridColumn({
                index: GRID_SELECTION_INDEX,
                title: '',
                showHeader: true,
                cell: (selected: boolean, row: any) => {
                    const onChange = event => this.selectRow(row, event);
                    const disabled = isLoading || isLoadingSelections;
                    return (
                        <input type="checkbox" disabled={disabled} checked={selected === true} onChange={onChange} />
                    );
                },
            });

            return List([selectColumn, ...model.displayColumns]);
        }

        return List(model.displayColumns);
    };

    headerCell = (column: GridColumn, index: number, columnCount?: number) => {
        const { allowSelections, allowSorting, model } = this.props;
        const { isLoading, isLoadingSelections, hasData, rowCount } = model;
        const disabled = isLoadingSelections || isLoading || (hasData && rowCount === 0);

        if (column.index === GRID_SELECTION_INDEX) {
            return headerSelectionCell(this.selectPage, model.selectedState, disabled);
        }

        return headerCell(this.sortColumn, column, index, allowSelections, allowSorting, columnCount);
    };

    render() {
        const {
            actions,
            advancedExportOptions,
            allowSelections,
            asPanel,
            ButtonsComponent,
            hideEmptyViewSelector,
            isPaged,
            pageSizes,
            model,
            showExport,
            showViewSelector,
        } = this.props;
        const {
            hasData,
            id,
            isLoading,
            isLoadingSelections,
            rowsError,
            selectionsError,
            messages,
            queryInfo,
            queryInfoError,
        } = model;
        const hasError = queryInfoError !== undefined || rowsError !== undefined || selectionsError !== undefined;
        const paginate = isPaged && hasData && !hasError;
        const canExport = showExport && !hasError;
        // Don't disable view selection when there is an error because it's possible the error may be caused by the view
        const canSelectView = showViewSelector && queryInfo !== undefined;
        const showLoading = isLoading || isLoadingSelections;
        let grid;
        let loadingMessage;
        let buttons;

        if (ButtonsComponent !== undefined) {
            buttons = <ButtonsComponent model={model} actions={actions} />;
        }

        if (isLoading) {
            loadingMessage = 'Loading data...';
        } else if (isLoadingSelections) {
            loadingMessage = 'Loading selections...';
        }

        if (hasError) {
            grid = <Alert>{queryInfoError || rowsError || selectionsError}</Alert>;
        } else if (hasData) {
            grid = (
                <Grid
                    headerCell={this.headerCell}
                    calcWidths
                    condensed
                    gridId={id}
                    messages={fromJS(messages)}
                    columns={this.getGridColumns()}
                    data={model.gridData}
                />
            );
        }

        return (
            <div className={classNames('grid-panel', { panel: asPanel, 'panel-default': asPanel })}>
                <div className={classNames('grid-panel__body', { 'panel-body': asPanel })}>
                    <div className="grid-panel__bar">
                        <div className="grid-panel__bar-left">
                            <div className="grid-bar__section">{buttons}</div>
                        </div>

                        <div className="grid-panel__bar-right">
                            <div className="grid-bar__section">
                                {paginate && <PaginationInfo model={model} />}
                                {paginate && <PaginationButtons model={model} actions={actions} />}
                                {paginate && <PageSizeSelector model={model} actions={actions} pageSizes={pageSizes} />}
                                {canExport && <ExportMenu model={model} advancedOptions={advancedExportOptions} />}
                                {canSelectView && (
                                    <ViewSelector
                                        model={model}
                                        actions={actions}
                                        allowSelections={allowSelections}
                                        hideEmptyViewSelector={hideEmptyViewSelector}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid-panel__info">
                        {showLoading && <LoadingSpinner msg={loadingMessage} />}
                        {allowSelections && <SelectionStatus model={model} actions={actions} />}
                    </div>

                    <div className="grid-panel__grid">{grid}</div>
                </div>
            </div>
        );
    }
}

class GridPanelWithModelImpl extends PureComponent<GridPanelProps & InjectedQueryModels> {
    render() {
        const { queryModels, actions, ...props } = this.props;
        return <GridPanel actions={actions} model={Object.values(queryModels)[0]} {...props} />;
    }
}

/**
 * GridPanelWithModel is a GridPanel component that also accepts the props for withQueryModels, however it assumes
 * that there will only ever be one model.
 *
 * In the future when GridPanel supports multiple models we will render tabs.
 */
export const GridPanelWithModel = withQueryModels<GridPanelProps>(GridPanelWithModelImpl);
