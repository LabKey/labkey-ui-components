import React, { ComponentType, PureComponent, ReactNode } from 'react';
import classNames from 'classnames';
import { fromJS, List } from 'immutable';
import { Query } from '@labkey/api';

import { Alert, Grid, GRID_CHECKBOX_OPTIONS, GridColumn, LoadingSpinner, QueryColumn, QueryInfo, QuerySort } from '..';
import { GRID_SELECTION_INDEX } from '../components/base/models/constants';
import { headerCell, headerSelectionCell } from '../renderers';
import { ActionValue } from '../components/omnibox/actions/Action';
import { FilterAction } from '../components/omnibox/actions/Filter';
import { SearchAction } from '../components/omnibox/actions/Search';
import { SortAction } from '../components/omnibox/actions/Sort';
import { ViewAction } from '../components/omnibox/actions/View';
import { Change, ChangeType, OmniBox } from '../components/omnibox/OmniBox';
import { Pagination } from '../components/pagination/Pagination';

import { InjectedQueryModels, RequiresModelAndActions, withQueryModels } from './withQueryModels';
import { ViewMenu } from './ViewMenu';
import { ExportMenu } from './ExportMenu';
import { SelectionStatus } from './SelectionStatus';
import { ChartMenu } from './ChartMenu';

import { actionValuesToString, filtersEqual, sortsEqual } from './utils';

interface GridPanelProps {
    allowSelections?: boolean;
    allowSorting?: boolean;
    asPanel?: boolean;
    advancedExportOptions?: { [key: string]: string };
    ButtonsComponent?: ComponentType<RequiresModelAndActions>;
    emptyText?: string;
    hideEmptyViewMenu?: boolean;
    pageSizes?: number[];
    title?: string;
    showButtonBar?: boolean;
    showChartMenu?: boolean;
    showExport?: boolean;
    showOmniBox?: boolean;
    showPagination?: boolean;
    showSampleComparisonReports?: boolean;
    showViewMenu?: boolean;
    showHeader?: boolean;
}

type Props = GridPanelProps & RequiresModelAndActions;

interface GridBarProps extends Props {
    onViewSelect: (viewName) => void;
}

class ButtonBar extends PureComponent<GridBarProps> {
    loadFirstPage = (): void => {
        const { model, actions } = this.props;
        actions.loadFirstPage(model.id);
    };

    loadLastPage = (): void => {
        const { model, actions } = this.props;
        actions.loadLastPage(model.id);
    };

    loadNextPage = (): void => {
        const { model, actions } = this.props;
        actions.loadNextPage(model.id);
    };

    loadPreviousPage = (): void => {
        const { model, actions } = this.props;
        actions.loadPreviousPage(model.id);
    };

    setPageSize = (pageSize: number): void => {
        const { model, actions } = this.props;
        actions.setMaxRows(model.id, pageSize);
    };

    render(): ReactNode {
        const {
            model,
            actions,
            advancedExportOptions,
            ButtonsComponent,
            hideEmptyViewMenu,
            onViewSelect,
            pageSizes,
            showChartMenu,
            showExport,
            showPagination,
            showSampleComparisonReports,
            showViewMenu,
        } = this.props;

        const { hasRows, queryInfo, queryInfoError, rowsError, selectionsError } = model;
        const hasError = queryInfoError !== undefined || rowsError !== undefined || selectionsError !== undefined;
        const paginate = showPagination && hasRows && !hasError;
        const canExport = showExport && !hasError;
        // Don't disable view selection when there is an error because it's possible the error may be caused by the view
        const canSelectView = showViewMenu && queryInfo !== undefined;

        return (
            <div className="grid-panel__button-bar">
                <div className="grid-panel__button-bar-left">
                    <div className="button-bar__section">
                        {ButtonsComponent !== undefined && <ButtonsComponent model={model} actions={actions} />}

                        {showChartMenu && (
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
                        {paginate && (
                            <Pagination
                                {...model.paginationData}
                                loadNextPage={this.loadNextPage}
                                loadFirstPage={this.loadFirstPage}
                                loadPreviousPage={this.loadPreviousPage}
                                loadLastPage={this.loadLastPage}
                                pageSizes={pageSizes}
                                setPageSize={this.setPageSize}
                            />
                        )}

                        {canExport && <ExportMenu model={model} advancedOptions={advancedExportOptions} />}

                        {canSelectView && (
                            <ViewMenu model={model} onViewSelect={onViewSelect} hideEmptyViewMenu={hideEmptyViewMenu} />
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

interface State {
    actionValues: ActionValue[];
}

export class GridPanel extends PureComponent<Props, State> {
    static defaultProps = {
        allowSelections: true,
        allowSorting: true,
        asPanel: true,
        hideEmptyViewMenu: false,
        showPagination: true,
        showButtonBar: true,
        showChartMenu: true,
        showExport: true,
        showOmniBox: true,
        showSampleComparisonReports: false,
        showViewMenu: true,
        showHeader: true
    };

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
            actionValues: [],
        };
    }

    componentDidMount(): void {
        const { model, actions, allowSelections } = this.props;
        actions.loadModel(model.id, allowSelections);
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        if (this.props.model.queryInfo !== undefined && this.props.model !== prevProps.model) {
            this.populateOmnibox();
        }
    }

    omniBoxActions: {
        filter: FilterAction;
        search: SearchAction;
        sort: SortAction;
        view: ViewAction;
    };

    omniBoxChangeHandlers: { [name: string]: (actionValues: ActionValue[], change: Change) => void };

    createOmniboxValues = (): ActionValue[] => {
        const { model } = this.props;
        const { filterArray, queryInfo, sorts, viewName } = model;
        const actionValues = [];

        if (model.viewName) {
            const view = queryInfo.views.get(viewName.toLowerCase())?.label ?? viewName;
            actionValues.push(this.omniBoxActions.view.actionValueFromView(view));
        }

        sorts.forEach((sort): void => {
            const column = model.getColumn(sort.fieldKey);
            actionValues.push(this.omniBoxActions.sort.actionValueFromSort(sort, column?.shortCaption));
        });

        filterArray.forEach((filter): void => {
            const column = model.getColumn(filter.getColumnName());

            if (filter.getColumnName() === '*') {
                actionValues.push(this.omniBoxActions.search.actionValueFromFilter(filter));
            } else {
                actionValues.push(this.omniBoxActions.filter.actionValueFromFilter(filter, column?.shortCaption));
            }
        });

        return actionValues;
    };

    /**
     * Populates the Omnibox with ActionValues based on the current model state. Requires that the model has a QueryInfo
     * so we can properly render Column and View labels.
     */
    populateOmnibox = (): void => {
        const modelActionValues = this.createOmniboxValues();
        const modelActionValuesStr = actionValuesToString(modelActionValues);
        const currentActionValuesStr = actionValuesToString(this.state.actionValues);

        if (modelActionValuesStr !== currentActionValuesStr) {
            // The action values have changed due to external model changes (likely URL changes), so we need to
            // update the Omnibox with the newest values.
            this.setState({ actionValues: modelActionValues });
        }
    };

    selectRow = (row, event): void => {
        const { model, actions } = this.props;
        const checked = event.target.checked === true;
        // Have to call toJS() on the row because <Grid /> converts rows to Immutable objects.
        actions.selectRow(model.id, checked, row.toJS());
    };

    selectPage = (event): void => {
        const { model, actions } = this.props;
        const checked = event.target.checked === true && model.selectedState !== GRID_CHECKBOX_OPTIONS.SOME;
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
    };

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
            const value = this.state.actionValues[change.index].valueObject;
            newFilters = newFilters.filter(filter => !filtersEqual(filter, value));
        }

        if (change.type === ChangeType.add || change.type === ChangeType.modify) {
            const newValue = actionValues[actionValues.length - 1].valueObject;
            const newColumnName = newValue.getColumnName();
            // Remove any filters on the same column, and append the new filter.
            newFilters = newFilters.filter(filter => filter.getColumnName() !== newColumnName).concat(newValue);
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

        // Defer model updates after localState is updated so we don't unnecessarily repopulate the omnibox.
        this.setState({ actionValues }, () => actions.setFilters(model.id, newFilters, allowSelections));
    };

    handleSortChange = (actionValues: ActionValue[], change: Change): void => {
        const { model, actions } = this.props;
        let updateSortsCallback: () => void;

        if (change.type === ChangeType.remove) {
            const value = this.state.actionValues[change.index].valueObject;
            const newSorts = model.sorts.filter(sort => !sortsEqual(sort, value));
            updateSortsCallback = () => actions.setSorts(model.id, newSorts);
        } else {
            const newActionValue = actionValues[actionValues.length - 1];
            const oldActionValue = this.state.actionValues[change.index];
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

                updateSortsCallback = () => actions.setSorts(model.id, newSorts);
            }
        }

        // Defer sorts update to after setState is complete so we dont unnecessarily repopulate the omnibox.
        this.setState({ actionValues }, updateSortsCallback);
    };

    handleSearchChange = (actionValues: ActionValue[], change: Change): void => {
        const { model, actions, allowSelections } = this.props;
        let newFilters = model.filterArray;

        if (change.type === ChangeType.modify || change.type === ChangeType.remove) {
            // Remove the filter with the value of oldValue
            const oldValue = this.state.actionValues[change.index].valueObject;
            newFilters = newFilters.filter(filter => !filtersEqual(filter, oldValue));
        }

        if (change.type === ChangeType.add || change.type === ChangeType.modify) {
            // Append the new value
            const newValue = actionValues[actionValues.length - 1].valueObject;
            newFilters = newFilters.concat(newValue);
        }

        // Defer search update to after setState so we don't unnecessarily repopulate the omnibox.
        this.setState({ actionValues }, () => actions.setFilters(model.id, newFilters, allowSelections));
    };

    handleViewChange = (actionValues: ActionValue[], change: Change): void => {
        const { model, actions, allowSelections } = this.props;
        let updateViewCallback: () => void;

        if (change.type === ChangeType.remove) {
            updateViewCallback = () => actions.setView(model.id, undefined, allowSelections);
        } else {
            const newActionValue = actionValues[actionValues.length - 1];
            const newValue = newActionValue.value;
            // OmniBox only passes view name not label, so we need to extract the view label.
            const viewLabel = model.queryInfo.views.get(newValue.toLowerCase())?.label ?? newValue;

            if (newValue !== model.viewName) {
                // Only trigger view change if the viewName has changed, OmniBox triggers modified event even if the
                // user keeps the value the same.
                updateViewCallback = () => actions.setView(model.id, newValue, allowSelections);
            }

            actionValues = [...actionValues.slice(0, actionValues.length - 1), { ...newActionValue, value: viewLabel }];
        }
        // Defer view update to after setState so we don't unnecessarily repopulate the omnibox.
        this.setState({ actionValues }, updateViewCallback);
    };

    /**
     * Change handler for OmniBox, GridPanel sets mergeValues to false, so this is a ValuesArrayHandler.
     * @param actionValues: ActionValue[]
     * @param change: Change
     */
    omniBoxChange = (actionValues: ActionValue[], change: Change): void => {
        let keyword;

        if (change.type === ChangeType.add || change.type === ChangeType.modify) {
            keyword = actionValues[actionValues.length - 1].action.keyword;
        } else {
            keyword = this.state.actionValues[change.index].action.keyword;
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
        const actionValues = this.state.actionValues.concat(actionValue);
        this.handleSortChange(actionValues, { type: ChangeType.add });
    };

    /**
     * Handler for the ViewSelectorComponent. Creates an OmniBox style change event and triggers handleViewChange.
     * @param viewName: the view name selected by the user.
     */
    onViewSelect = (viewName: string): void => {
        const actionValue = { value: viewName, action: this.omniBoxActions.view };
        let changeType = ChangeType.remove;
        let actionValues = this.state.actionValues.filter(av => av.action.keyword !== 'view');

        if (viewName !== undefined) {
            changeType = ChangeType.add;
            actionValues = actionValues.concat(actionValue);
        }

        this.handleViewChange(actionValues, { type: changeType });
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
                        <input
                            className="grid-panel__row-checkbox"
                            type="checkbox"
                            disabled={disabled}
                            checked={selected === true}
                            onChange={onChange} // eslint-disable-line
                        />
                    );
                },
            });

            return List([selectColumn, ...model.displayColumns]);
        }

        return List(model.displayColumns);
    };

    headerCell = (column: GridColumn, index: number, columnCount?: number): ReactNode => {
        const { allowSelections, allowSorting, model } = this.props;
        const { isLoading, isLoadingSelections, hasRows, rowCount } = model;
        const disabled = isLoadingSelections || isLoading || (hasRows && rowCount === 0);

        if (column.index === GRID_SELECTION_INDEX) {
            return headerSelectionCell(this.selectPage, model.selectedState, disabled, 'grid-panel__page-checkbox');
        }

        return headerCell(this.sortColumn, column, index, allowSelections, allowSorting, columnCount);
    };

    render(): ReactNode {
        const { actions, allowSelections, asPanel, emptyText, model, showButtonBar, showOmniBox, showHeader, title } = this.props;
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
        const hasGridError = queryInfoError !== undefined || rowsError !== undefined;
        const hasError = hasGridError || selectionsError !== undefined;
        let loadingMessage;
        const gridIsLoading = !hasGridError && isLoading;
        const selectionsAreLoading = !hasError && allowSelections && isLoadingSelections;

        if (gridIsLoading) {
            loadingMessage = 'Loading data...';
        } else if (selectionsAreLoading) {
            loadingMessage = 'Loading selections...';
        }

        return (
            <div className={classNames('grid-panel', { panel: asPanel, 'panel-default': asPanel })}>
                {title !== undefined && asPanel && (
                    <div className="grid-panel__title panel-heading">
                        <span>{title}</span>
                    </div>
                )}

                <div className={classNames('grid-panel__body', { 'panel-body': asPanel })}>
                    {showButtonBar && <ButtonBar {...this.props} onViewSelect={this.onViewSelect} />}

                    {showOmniBox && (
                        <div className="grid-panel__omnibox">
                            <OmniBox
                                actions={Object.values(this.omniBoxActions)}
                                disabled={hasError || isLoading}
                                getColumns={this.getColumns}
                                getSelectDistinctOptions={this.getSelectDistinctOptions}
                                mergeValues={false}
                                onChange={this.omniBoxChange}
                                values={this.state.actionValues}
                            />
                        </div>
                    )}

                    {(loadingMessage || allowSelections) && (
                        <div className="grid-panel__info">
                            {loadingMessage && <LoadingSpinner msg={loadingMessage}/>}
                            {allowSelections && <SelectionStatus model={model} actions={actions}/>}
                        </div>
                    )}

                    <div className="grid-panel__grid">
                        {hasError && <Alert>{queryInfoError || rowsError || selectionsError}</Alert>}

                        {!hasGridError && hasData && (
                            <Grid
                                headerCell={this.headerCell}
                                showHeader={showHeader}
                                calcWidths
                                condensed
                                emptyText={emptyText}
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
