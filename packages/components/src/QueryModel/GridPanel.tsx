import React, { ComponentType, PureComponent, ReactNode } from 'react';
import classNames from 'classnames';
import { fromJS, List } from 'immutable';
import { Query } from '@labkey/api';

import { Alert, Grid, GRID_CHECKBOX_OPTIONS, GridColumn, LoadingSpinner, QueryColumn, QueryInfo, QuerySort } from '..';
import { GRID_SELECTION_INDEX } from '../components/base/models/constants';
import { headerCell, headerSelectionCell } from '../renderers';

import { InjectedQueryModels, RequiresModelAndActions, withQueryModels } from './withQueryModels';
import { PaginationButtons, PaginationInfo } from './Pagination';
import { PageSizeMenu } from './PageSizeMenu';
import { ViewMenu } from './ViewMenu';
import { ExportMenu } from './ExportMenu';
import { SelectionStatus } from './SelectionStatus';
import { ChartMenu } from './ChartMenu';
import { Action, ActionValue } from '../components/omnibox/actions/Action';
import { FilterAction } from '../components/omnibox/actions/Filter';
import { SearchAction } from '../components/omnibox/actions/Search';
import { SortAction } from '../components/omnibox/actions/Sort';
import { ViewAction } from '../components/omnibox/actions/View';

import { Change, ChangeType, OmniBox } from '../components/omnibox/OmniBox';
import { filtersEqual, sortsEqual } from './utils';

interface GridPanelProps {
    allowSelections?: boolean;
    allowSorting?: boolean;
    asPanel?: boolean;
    advancedExportOptions?: { [key: string]: string };
    ButtonsComponent?: ComponentType<RequiresModelAndActions>;
    hideEmptyViewSelector?: boolean;
    isPaged?: boolean;
    pageSizes?: number[];
    showChartSelector?: boolean;
    showExport?: boolean;
    showOmniBox?: boolean;
    showSampleComparisonReports?: boolean;
    showViewSelector?: boolean;
}

type Props = GridPanelProps & RequiresModelAndActions;

interface GridBarProps extends Props {
    onViewSelect: (viewName) => void;
}

class ButtonBar extends PureComponent<GridBarProps> {
    render(): ReactNode {
        const {
            model,
            actions,
            advancedExportOptions,
            ButtonsComponent,
            hideEmptyViewSelector,
            onViewSelect,
            pageSizes,
            showChartSelector,
            showExport,
            showSampleComparisonReports,
            showViewSelector,
        } = this.props;
        const { hasData, isPaged, queryInfo, queryInfoError, rowsError, selectionsError } = model;
        const hasError = queryInfoError !== undefined || rowsError !== undefined || selectionsError !== undefined;
        const paginate = isPaged && hasData && !hasError;
        const canExport = showExport && !hasError;
        // Don't disable view selection when there is an error because it's possible the error may be caused by the view
        const canSelectView = showViewSelector && queryInfo !== undefined;

        return (
            <div className="grid-panel__button-bar">
                <div className="grid-panel__button-bar-left">
                    <div className="button-bar__section">
                        {ButtonsComponent !== undefined && <ButtonsComponent model={model} actions={actions} />}

                        {showChartSelector && (
                            <ChartMenu
                                model={model}
                                actions={actions}
                                showSampleComparisonReports={showSampleComparisonReports}
                            />
                        )}
                    </div>
                </div>

                <div className="grid-panel__button-bar-right">
                    <div className="button-bar__section">
                        {paginate && <PaginationInfo model={model} />}
                        {paginate && <PaginationButtons model={model} actions={actions} />}
                        {paginate && <PageSizeMenu model={model} actions={actions} pageSizes={pageSizes} />}
                        {canExport && <ExportMenu model={model} advancedOptions={advancedExportOptions} />}
                        {canSelectView && (
                            <ViewMenu
                                model={model}
                                onViewSelect={onViewSelect}
                                hideEmptyViewSelector={hideEmptyViewSelector}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

interface State {
    omniBoxValues: ActionValue[],
}

export class GridPanel extends PureComponent<Props, State> {
    static defaultProps = {
        allowSelections: true,
        allowSorting: true,
        asPanel: true,
        hideEmptyViewSelector: false,
        isPaged: true,
        showChartSelector: true,
        showExport: true,
        showOmniBox: true,
        showSampleComparisonReports: false,
        showViewSelector: true,
    };

    omniBoxActions: { [name: string]: Action };

    omniBoxChangeHandlers: { [name: string]: (actionValues: ActionValue[], change: Change) =>  void };

    constructor(props) {
        super(props);
        const { id } = props.model;

        this.omniBoxActions = {
            filter: new FilterAction(id, this.getColumns),
            search: new SearchAction(id),
            sort: new SortAction(id, this.getColumns),
            view: new ViewAction(id, this.getColumns, this.getQueryInfo),
        };

        this.omniBoxChangeHandlers = {
            filter: this.handleFilterChange,
            search: this.handleSearchChange,
            sort: this.handleSortChange,
            view: this.handleViewChange,
        };

        this.state = {
            omniBoxValues: [],
        };
    }

    componentDidMount(): void {
        const { model, actions, allowSelections } = this.props;
        actions.loadModel(model.id, allowSelections);
    }

    selectRow = (row, event): void => {
        const { model, actions } = this.props;
        const checked = event.currentTarget.checked === true;
        // Have to call toJS() on the row because <Grid /> converts rows to Immutable objects.
        actions.selectRow(model.id, checked, row.toJS());
    };

    selectPage = (event): void => {
        const { model, actions } = this.props;
        const checked = event.currentTarget.checked === true && model.selectedState !== GRID_CHECKBOX_OPTIONS.SOME;
        actions.selectPage(model.id, checked);
    };

    // Needed by OmniBox.
    getColumns = (all = false): List<QueryColumn> => {
        const { model } = this.props;
        return all ? List(model.allColumns) : List(model.displayColumns);
    };

    // Needed by OmniBox.
    getQueryInfo = (): QueryInfo => {
        return this.props.model.queryInfo;
    }

    // Needed by OmniBox.
    getSelectDistinctOptions = (column: string): Query.SelectDistinctOptions => {
        const { model } = this.props;
        return {
            column,
            containerFilter: model.containerFilter,
            containerPath: model.containerPath,
            schemaName: model.schemaName,
            queryName: model.queryName,
            viewName: model.viewName,
            filterArray: model.filters,
            parameters: model.queryParameters,
        };
    };

    handleFilterChange = (actionValues: ActionValue[], change: Change): void => {
        const { model, actions, allowSelections } = this.props;
        let newFilters = model.filterArray;

        if (change.type === ChangeType.modify || change.type === ChangeType.remove) {
            // Remove the old filter
            const value = this.state.omniBoxValues[change.index].valueObject;
            newFilters = newFilters.filter(filter => !filtersEqual(filter, value));
        }

        if (change.type === ChangeType.add || change.type === ChangeType.modify) {
            const newValue = actionValues[actionValues.length - 1].valueObject;
            const newColumnName = newValue.getColumnName();
            // Remove any filters on the same column, and append the new filter.
            newFilters = newFilters.filter(filter => filter.getColumnName() !== newColumnName).concat([newValue]);
            // Remove any filter ActionValues with the same columnName as well.
            actionValues = actionValues.filter(actionValue => {
                const { action, valueObject } = actionValue;

                if (action.keyword !== 'filter') {
                    return true;
                }

                // Keep the new value, and any ActionValues on different columns.
                return valueObject === newValue || valueObject.getColumnName() !== newColumnName;
            });
        }

        actions.setFilters(model.id, newFilters, allowSelections);
        this.setState({ omniBoxValues: actionValues });
    };

    handleSortChange = (actionValues: ActionValue[], change: Change): void => {
        const { model, actions } = this.props;

        if (change.type === ChangeType.remove) {
            const value = this.state.omniBoxValues[change.index].valueObject;
            const newSorts = model.sorts.filter(sort => !sortsEqual(sort, value));
            actions.setSorts(model.id, newSorts);
        } else {
            const newActionValue = actionValues[actionValues.length - 1];
            const oldActionValue = this.state.omniBoxValues[change.index];
            const newValue = newActionValue.valueObject;
            const oldValue = oldActionValue?.valueObject;

            if (oldValue === undefined || !sortsEqual(oldValue, newValue)) {
                const newSorts = [];

                actionValues = actionValues.filter((actionValue): boolean => {
                    const { action, valueObject } = actionValue;

                    if (action.keyword !== 'sort') {
                        return true;
                    }

                    // It doesn't make sense to have multiple sorts on one column.
                    const keepSort = valueObject === newValue || valueObject.fieldKey !== newValue.fieldKey;

                    if (keepSort) {
                        newSorts.push(valueObject);
                    }

                    return keepSort;
                });

                actions.setSorts(model.id, newSorts);
            }
        }

        this.setState({ omniBoxValues: actionValues });
    };

    handleSearchChange = (actionValues: ActionValue[], change: Change): void => {
        const { model, actions, allowSelections } = this.props;
        let newFilters = model.filterArray;

        if (change.type === ChangeType.modify || change.type === ChangeType.remove) {
            // Remove the filter with the value of oldValue
            const oldValue = this.state.omniBoxValues[change.index].valueObject;
            newFilters = newFilters.filter(filter => !filtersEqual(filter, oldValue));
        }

        if (change.type === ChangeType.add || change.type === ChangeType.modify) {
            // Append the new value
            const newValue = actionValues[actionValues.length - 1].valueObject;
            newFilters = newFilters.concat([newValue]);
        }

        actions.setFilters(model.id, newFilters, allowSelections);
        this.setState({ omniBoxValues: actionValues });
    };

    handleViewChange = (actionValues: ActionValue[], change: Change): void => {
        const { model, actions, allowSelections } = this.props;

        if (change.type === ChangeType.remove) {
            actions.setView(model.id, undefined, allowSelections);
        } else {
            const newActionValue = actionValues[actionValues.length - 1];
            const newValue = newActionValue.value;
            // OmniBox only passes view name not label, so we need to extract the view label.
            const viewLabel = model.queryInfo.views.get(newValue.toLowerCase())?.label ?? newValue;

            if (newValue !== model.viewName) {
                // Only trigger view change if the viewName has changed, OmniBox triggers modified event even if the
                // user keeps the value the same.
                actions.setView(model.id, newValue, allowSelections);
            }

            actionValues = [
                ...actionValues.slice(0, actionValues.length - 1),
                { ...newActionValue, value: viewLabel },
            ];
        }

        this.setState({ omniBoxValues: actionValues });
    };

    /**
     * Change handler for OmniBox, GridPanel sets mergeValues to false, so this is a ValuesArrayHandler.
     * @param actionValues: ActionValue[]
     * @param change: Change
     */
    omniBoxChange = (actionValues: ActionValue[], change: Change) => {
        let keyword;

        if (change.type === ChangeType.add || change.type === ChangeType.modify) {
            keyword = actionValues[actionValues.length - 1].action.keyword;
        } else {
            keyword = this.state.omniBoxValues[change.index].action.keyword;
        }

        this.omniBoxChangeHandlers[keyword](actionValues, change);
    };

    /**
     * Handler called when the user clicks a sort action from a column dropdown menu. Creates an OmniBox style change
     * event and triggers handleSortChange.
     * @param column: QueryColumn
     * @param direction: '+' or '-'
     */
    sortColumn = (column: QueryColumn, direction): void => {
        const dir = direction === '+' ? '' : '-'; // Sort Action only uses '-' and ''
        const fieldKey = column.resolveFieldKey(); // resolveFieldKey because of Issue 34627
        const sort = new QuerySort({ fieldKey, dir });
        const actionValue = {
            displayValue: column.shortCaption,
            value: `${fieldKey} ${direction === '+' ? 'asc' : 'desc'}`,
            valueObject: sort,
            action: this.omniBoxActions.sort,
        };
        const actionValues = this.state.omniBoxValues.concat([actionValue]);
        this.handleSortChange(actionValues, { type: ChangeType.add, index: undefined });
    };

    /**
     * Handler for the ViewSelectorComponent. Creates an OmniBox style change event and triggers handleViewChange.
     * @param viewName: the view name selected by the user.
     */
    onViewSelect = (viewName: string): void => {
        const actionValue = { value: viewName, action: this.omniBoxActions.view };
        let changeType = ChangeType.remove;
        let actionValues = this.state.omniBoxValues.filter(av => av.action.keyword !== 'view');

        if (viewName !== undefined) {
            changeType = ChangeType.add;
            actionValues = actionValues.concat([actionValue]);
        }

        this.handleViewChange(actionValues, { type: changeType, index: undefined });
    };

    getGridColumns = (): List<GridColumn | QueryColumn> => {
        const { allowSelections, model } = this.props;
        const { isLoading, isLoadingSelections } = model;

        if (allowSelections) {
            const selectColumn = new GridColumn({
                index: GRID_SELECTION_INDEX,
                title: '',
                showHeader: true,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cell: (selected: boolean, row: any): ReactNode => {
                    const onChange = (event): void => this.selectRow(row, event);
                    const disabled = isLoading || isLoadingSelections;
                    return (
                        // eslint-disable-next-line react/jsx-no-bind
                        <input type="checkbox" disabled={disabled} checked={selected === true} onChange={onChange} />
                    );
                },
            });

            return List([selectColumn, ...model.displayColumns]);
        }

        return List(model.displayColumns);
    };

    headerCell = (column: GridColumn, index: number, columnCount?: number): ReactNode => {
        const { allowSelections, allowSorting, model } = this.props;
        const { isLoading, isLoadingSelections, hasData, rowCount } = model;
        const disabled = isLoadingSelections || isLoading || (hasData && rowCount === 0);

        if (column.index === GRID_SELECTION_INDEX) {
            return headerSelectionCell(this.selectPage, model.selectedState, disabled);
        }

        return headerCell(this.sortColumn, column, index, allowSelections, allowSorting, columnCount);
    };

    render(): ReactNode {
        const { actions, allowSelections, asPanel, model, showOmniBox } = this.props;
        const {
            hasData,
            id,
            isLoading,
            isLoadingSelections,
            rowsError,
            selectionsError,
            messages,
            queryInfoError,
        } = model;
        const hasError = queryInfoError !== undefined || rowsError !== undefined || selectionsError !== undefined;
        let loadingMessage;

        if (isLoading) {
            loadingMessage = 'Loading data...';
        } else if (isLoadingSelections) {
            loadingMessage = 'Loading selections...';
        }

        return (
            <div className={classNames('grid-panel', { panel: asPanel, 'panel-default': asPanel })}>
                <div className={classNames('grid-panel__body', { 'panel-body': asPanel })}>
                    <ButtonBar {...this.props} onViewSelect={this.onViewSelect} />

                    {showOmniBox && (
                        <div className="grid-panel__omnibox">
                            <OmniBox
                                actions={Object.values(this.omniBoxActions)}
                                disabled={hasError || isLoading}
                                getColumns={this.getColumns}
                                getSelectDistinctOptions={this.getSelectDistinctOptions}
                                mergeValues={false}
                                onChange={this.omniBoxChange}
                                values={this.state.omniBoxValues}
                            />
                        </div>
                    )}

                    <div className="grid-panel__info">
                        {loadingMessage && <LoadingSpinner msg={loadingMessage} />}
                        {allowSelections && <SelectionStatus model={model} actions={actions} />}
                    </div>

                    <div className="grid-panel__grid">
                        {hasError && <Alert>{queryInfoError || rowsError || selectionsError}</Alert>}

                        {(!hasError && hasData) && (
                            <Grid
                                headerCell={this.headerCell}
                                calcWidths
                                condensed
                                gridId={id}
                                messages={fromJS(messages)}
                                columns={this.getGridColumns()}
                                data={model.gridData}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

class GridPanelWithModelImpl extends PureComponent<GridPanelProps & InjectedQueryModels> {
    render(): ReactNode {
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
