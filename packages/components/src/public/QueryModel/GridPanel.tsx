import React, { ComponentType, FC, memo, PureComponent, ReactNode, useMemo } from 'react';
import classNames from 'classnames';
import { fromJS, List, Set } from 'immutable';
import { Filter, Query } from '@labkey/api';

import {
    Alert,
    DataViewInfoTypes,
    EXPORT_TYPES,
    Grid,
    GRID_CHECKBOX_OPTIONS,
    GridColumn,
    LoadingSpinner,
    Pagination,
    QueryColumn,
    QueryConfig,
    QueryInfo,
    QuerySort,
} from '../..';
import { GRID_SELECTION_INDEX } from '../../internal/constants';
import { DataViewInfo } from '../../internal/models';
import { headerCell, headerSelectionCell, isFilterColumnNameMatch } from '../../internal/renderers';
import { ActionValue } from '../../internal/components/omnibox/actions/Action';
import { FilterAction } from '../../internal/components/omnibox/actions/Filter';
import { SearchAction } from '../../internal/components/omnibox/actions/Search';
import { SortAction } from '../../internal/components/omnibox/actions/Sort';
import { ViewAction } from '../../internal/components/omnibox/actions/View';
import { Change, ChangeType } from '../../internal/components/omnibox/OmniBox';

import { removeActionValue, replaceSearchValue } from '../../internal/components/omnibox/utils';

import { QueryModel, createQueryModelId } from './QueryModel';
import { InjectedQueryModels, RequiresModelAndActions, withQueryModels } from './withQueryModels';
import { ViewMenu } from './ViewMenu';
import { ExportMenu } from './ExportMenu';
import { SelectionStatus } from './SelectionStatus';
import { ChartMenu } from './ChartMenu';
import { SearchBox } from './SearchBox';

import { actionValuesToString, filtersEqual, sortsEqual } from './utils';
import { GridFilterModal } from './GridFilterModal';
import { FiltersButton } from './FiltersButton';
import { FilterStatus } from './FilterStatus';

export interface GridPanelProps<ButtonsComponentProps> {
    allowSelections?: boolean;
    allowSorting?: boolean;
    allowFiltering?: boolean;
    asPanel?: boolean;
    advancedExportOptions?: { [key: string]: any };
    ButtonsComponent?: ComponentType<ButtonsComponentProps & RequiresModelAndActions>;
    buttonsComponentProps?: ButtonsComponentProps;
    ButtonsComponentRight?: ComponentType<ButtonsComponentProps & RequiresModelAndActions>;
    emptyText?: string;
    getEmptyText?: (model: QueryModel) => string;
    hideEmptyChartMenu?: boolean;
    hideEmptyViewMenu?: boolean;
    loadOnMount?: boolean;
    onChartClicked?: (chart: DataViewInfo) => boolean;
    onCreateReportClicked?: (type: DataViewInfoTypes) => void;
    onExport?: { [key: string]: () => any };
    pageSizes?: number[];
    title?: string;
    showButtonBar?: boolean;
    showChartMenu?: boolean;
    showExport?: boolean;
    showFiltersButton?: boolean;
    showFilterStatus?: boolean;
    showOmniBox?: boolean;
    showPagination?: boolean;
    showSampleComparisonReports?: boolean;
    showSearchInput?: boolean;
    showViewMenu?: boolean;
    showHeader?: boolean;
    supportedExportTypes?: Set<EXPORT_TYPES>;
    getFilterDisplayValue?: (columnName: string, rawValue: string) => string;
    highlightLastSelectedRow?: boolean;
}

type Props<T> = GridPanelProps<T> & RequiresModelAndActions;

interface GridBarProps<T> extends Props<T> {
    actionValues: ActionValue[];
    onViewSelect: (viewName: string) => void;
    onSearch: (token: string) => void;
    onFilter: () => void;
}

class ButtonBar<T> extends PureComponent<GridBarProps<T>> {
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
            actionValues,
            model,
            actions,
            advancedExportOptions,
            ButtonsComponent,
            ButtonsComponentRight,
            hideEmptyChartMenu,
            hideEmptyViewMenu,
            onChartClicked,
            onCreateReportClicked,
            onExport,
            onFilter,
            onSearch,
            onViewSelect,
            pageSizes,
            showChartMenu,
            showExport,
            showFiltersButton,
            showPagination,
            showSampleComparisonReports,
            showSearchInput,
            showViewMenu,
            supportedExportTypes,
        } = this.props;

        const { hasRows, queryInfo, queryInfoError, rowsError, selectionsError } = model;
        const hasError = queryInfoError !== undefined || rowsError !== undefined || selectionsError !== undefined;
        const paginate = showPagination && hasRows && !hasError;
        const canExport = showExport && !hasError;
        // Don't disable view selection when there is an error because it's possible the error may be caused by the view
        const canSelectView = showViewMenu && queryInfo !== undefined;
        const buttonsComponentProps = this.props.buttonsComponentProps ?? ({} as T);

        return (
            <div className="grid-panel__button-bar">
                <div className="grid-panel__button-bar-left">
                    <div className="button-bar__section">
                        {ButtonsComponent !== undefined && (
                            <ButtonsComponent {...buttonsComponentProps} model={model} actions={actions} />
                        )}
                        {showFiltersButton && <FiltersButton onFilter={onFilter} />}
                        {showSearchInput && <SearchBox actionValues={actionValues} onSearch={onSearch} />}
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
                        {canExport && (
                            <ExportMenu
                                model={model}
                                advancedOptions={advancedExportOptions}
                                supportedTypes={supportedExportTypes}
                                onExport={onExport}
                            />
                        )}
                        {showChartMenu && (
                            <ChartMenu
                                hideEmptyChartMenu={hideEmptyChartMenu}
                                actions={actions}
                                model={model}
                                onChartClicked={onChartClicked}
                                onCreateReportClicked={onCreateReportClicked}
                                showSampleComparisonReports={showSampleComparisonReports}
                            />
                        )}
                        {canSelectView && (
                            <ViewMenu model={model} onViewSelect={onViewSelect} hideEmptyViewMenu={hideEmptyViewMenu} />
                        )}
                        {ButtonsComponentRight !== undefined && (
                            <ButtonsComponentRight {...buttonsComponentProps} model={model} actions={actions} />
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

interface State {
    actionValues: ActionValue[];
    showFilterModalFieldKey: string;
    headerClickCount: { [key: string]: number };
}

/**
 * Render a QueryModel as an interactive grid. For in-depth documentation and examples see components/docs/QueryModel.md.
 */
export class GridPanel<T = {}> extends PureComponent<Props<T>, State> {
    static defaultProps = {
        allowSelections: true,
        allowSorting: true,
        allowFiltering: true,
        asPanel: true,
        hideEmptyChartMenu: true,
        hideEmptyViewMenu: true,
        highlightLastSelectedRow: false,
        loadOnMount: true,
        showPagination: true,
        showButtonBar: true,
        showChartMenu: true,
        showExport: true,
        showFiltersButton: true,
        showFilterStatus: true,
        showOmniBox: true,
        showSampleComparisonReports: false,
        showSearchInput: true,
        showViewMenu: true,
        showHeader: true,
    };

    constructor(props) {
        super(props);
        const { id } = props.model;

        this.omniBoxActions = {
            filter: new FilterAction(id, this.getColumns, null, props.getFilterDisplayValue),
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
            showFilterModalFieldKey: undefined,
            headerClickCount: {},
        };
    }

    componentDidMount(): void {
        const { model, actions, allowSelections, loadOnMount } = this.props;
        if (loadOnMount) {
            actions.loadModel(model.id, allowSelections);
        }
    }

    componentDidUpdate(prevProps: Readonly<Props<T>>): void {
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
            const view = queryInfo.views.get(viewName.toLowerCase());
            const name = view?.label ?? viewName;
            // Don't display hidden views in the OmniBox
            if (!view?.hidden) actionValues.push(this.omniBoxActions.view.actionValueFromView(name));
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

    // Needed by OmniBox and GridFilterModal.
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

    handleFilterChange = (actionValues: ActionValue[], change: Change, column?: QueryColumn): void => {
        const { model, actions, allowSelections } = this.props;
        let newFilters = model.filterArray;

        if (change.type === ChangeType.modify || change.type === ChangeType.remove) {
            // If a column is provided instead of a change.index, then we will remove all filters for that column.
            if (change.index !== undefined) {
                const value = this.state.actionValues[change.index].valueObject;
                newFilters = newFilters.filter(filter => !filtersEqual(filter, value));
            } else if (column) {
                newFilters = newFilters.filter(filter => !isFilterColumnNameMatch(filter, column));
            } else {
                // remove all filters, but keep the search
                newFilters = newFilters.filter(filter => filter.getFilterType() === Filter.Types.Q);
            }
        }

        if (change.type === ChangeType.add || change.type === ChangeType.modify) {
            const newValue = actionValues[actionValues.length - 1].valueObject;
            const newColumnName = newValue.getColumnName();
            const newFilterTypeSuffix = newValue.getFilterType().getURLSuffix();

            // Remove any filters on the same column with the same filter type. Append the new filter.
            newFilters = newFilters
                .filter(
                    f => f.getColumnName() !== newColumnName || f.getFilterType().getURLSuffix() !== newFilterTypeSuffix
                )
                .concat(newValue);

            // Remove any filter ActionValues with the same columnName as well.
            actionValues = actionValues.filter(
                ({ action, valueObject }) =>
                    action.keyword !== 'filter' ||
                    valueObject === newValue ||
                    valueObject.getColumnName() !== newColumnName ||
                    valueObject.getFilterType().getURLSuffix() !== newFilterTypeSuffix
            );
        }

        // Defer model updates after localState is updated so we don't unnecessarily repopulate the omnibox.
        this.setState({ actionValues, headerClickCount: {} }, () =>
            actions.setFilters(model.id, newFilters, allowSelections)
        );
    };

    handleApplyFilters = (newFilters: Filter.IFilter[]): void => {
        const { model, actions, allowSelections } = this.props;

        this.setState(
            {
                actionValues: this.state.actionValues,
                showFilterModalFieldKey: undefined,
                headerClickCount: {},
            },
            () => actions.setFilters(model.id, newFilters, allowSelections)
        );
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
        this.setState({ actionValues, headerClickCount: {} }, updateSortsCallback);
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
        this.setState({ actionValues, headerClickCount: {} }, () =>
            actions.setFilters(model.id, newFilters, allowSelections)
        );
    };

    onSearch = (value: string): void => {
        const { actionValues, change } = replaceSearchValue(this.state.actionValues, value, this.omniBoxActions.search);
        this.handleSearchChange(actionValues, change);
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
        this.setState(
            {
                actionValues,
                headerClickCount: {}, // view change will refresh the grid, so clear the headerClickCount values
            },
            updateViewCallback
        );
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
            keyword = this.state.actionValues[change.index]?.action.keyword;
        }

        this.omniBoxChangeHandlers[keyword]?.(actionValues, change);
    };

    /**
     * Handler called when the user clicks a filter action from the column dropdown menu.
     * @param column: QueryColumn
     * @param remove: true if the user is requesting to remove the filters for this column
     */
    filterColumn = (column: QueryColumn, remove = false): void => {
        const fieldKey = column.resolveFieldKey(); // resolveFieldKey because of Issue 34627

        if (remove) {
            const newActionValues = this.state.actionValues.filter(actionValue => {
                return !(
                    actionValue.action === this.omniBoxActions.filter &&
                    isFilterColumnNameMatch(actionValue.valueObject, column)
                );
            });

            this.handleFilterChange(newActionValues, { type: ChangeType.remove }, column);
        } else {
            this.setState({ showFilterModalFieldKey: fieldKey });
        }
    };

    removeAllFilters = (): void => {
        const { actionValues } = this.state;
        const newActionValues = actionValues.filter(actionValue => {
            return actionValue.action === this.omniBoxActions.filter;
        });

        this.handleFilterChange(newActionValues, { type: ChangeType.remove });
    };

    removeFilter = (index: number): void => {
        const { actionValues } = this.state;
        this.handleFilterChange(removeActionValue(actionValues, index), { type: ChangeType.remove, index });
    };

    showFilterModal = (actionValue?: ActionValue): void => {
        const { model } = this.props;
        const displayColumns = model.displayColumns;

        // if the user clicked to edit an existing filter, use that filter's column name when opening the modal
        // else open modal with the first field selected
        const columnName = actionValue?.valueObject?.getColumnName();
        const colIndex = columnName
            ? Math.max(
                  displayColumns.findIndex(col => col.resolveFieldKey() === columnName),
                  0 // fall back to the first field if no match
              )
            : 0;
        const fieldKey = displayColumns[colIndex]?.resolveFieldKey();

        this.setState({ showFilterModalFieldKey: fieldKey });
    };

    closeFilterModal = (): void => {
        this.setState({ showFilterModalFieldKey: undefined });
    };

    /**
     * Handler called when the user clicks a sort action from a column dropdown menu. Creates an OmniBox style change
     * event and triggers handleSortChange.
     * @param column: QueryColumn
     * @param direction: '+' or '-', use undefined for "clear sort" case
     */
    sortColumn = (column: QueryColumn, direction?: string): void => {
        const fieldKey = column.resolveFieldKey(); // resolveFieldKey because of Issue 34627

        if (direction) {
            const dir = direction === '+' ? '' : '-'; // Sort Action only uses '-' and ''
            const sort = new QuerySort({ fieldKey, dir });
            const actionValue = {
                displayValue: column.shortCaption,
                value: `${fieldKey} ${direction === '+' ? 'asc' : 'desc'}`,
                valueObject: sort,
                action: this.omniBoxActions.sort,
            };
            const actionValues = this.state.actionValues.concat(actionValue);

            this.handleSortChange(actionValues, { type: ChangeType.add });
        } else {
            let actionIndex = -1;
            const newActionValues = this.state.actionValues.filter((actionValue, i) => {
                if (actionValue.action === this.omniBoxActions.sort && actionValue.valueObject.fieldKey === fieldKey) {
                    actionIndex = i;
                    return false;
                }
                return true;
            });

            if (actionIndex > -1) {
                this.handleSortChange(newActionValues, { type: ChangeType.remove, index: actionIndex });
            }
        }
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

    onHeaderCellClick = (column: GridColumn): void => {
        this.setState(state => {
            return {
                headerClickCount: {
                    ...state.headerClickCount,
                    [column.index]: (state.headerClickCount[column.index] ?? 0) + 1,
                },
            };
        });
    };

    headerCell = (column: GridColumn, index: number, columnCount?: number): ReactNode => {
        const { headerClickCount } = this.state;
        const { allowSelections, allowSorting, allowFiltering, model } = this.props;
        const { isLoading, isLoadingSelections, hasRows, rowCount } = model;
        const disabled = isLoadingSelections || isLoading || (hasRows && rowCount === 0);

        if (column.index === GRID_SELECTION_INDEX) {
            return headerSelectionCell(this.selectPage, model.selectedState, disabled, 'grid-panel__page-checkbox');
        }

        return headerCell(
            index,
            column,
            allowSelections,
            columnCount,
            allowSorting ? this.sortColumn : undefined,
            allowFiltering ? this.filterColumn : undefined,
            model,
            headerClickCount[column.index]
        );
    };

    getHighlightRowIndexes(): List<number> {
        const { highlightLastSelectedRow, model } = this.props;
        if (!highlightLastSelectedRow || !model.hasSelections) return undefined;

        const lastSelectedId = Array.from(model.selections).pop();
        return List<number>([model.orderedRows.indexOf(lastSelectedId)]);
    }

    render(): ReactNode {
        const {
            actions,
            allowSelections,
            asPanel,
            emptyText,
            getEmptyText,
            model,
            onExport,
            showButtonBar,
            showFilterStatus,
            showOmniBox,
            showHeader,
            title,
        } = this.props;
        const { showFilterModalFieldKey, actionValues } = this.state;
        const { hasData, id, isLoading, isLoadingSelections, rowsError, selectionsError, messages, queryInfoError } =
            model;
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

        const gridEmptyText = getEmptyText?.(model) ?? emptyText;

        return (
            <>
                <div className={classNames('grid-panel', { panel: asPanel, 'panel-default': asPanel })}>
                    {title !== undefined && asPanel && (
                        <div className="grid-panel__title panel-heading">
                            <span>{title}</span>
                        </div>
                    )}

                    <div className={classNames('grid-panel__body', { 'panel-body': asPanel })}>
                        {showButtonBar && (
                            <ButtonBar
                                {...this.props}
                                actionValues={actionValues}
                                onExport={onExport}
                                onFilter={this.showFilterModal}
                                onSearch={this.onSearch}
                                onViewSelect={this.onViewSelect}
                            />
                        )}

                        {/*{showOmniBox && (*/}
                        {/*    <div className="grid-panel__omnibox">*/}
                        {/*        <OmniBox*/}
                        {/*            actions={Object.values(this.omniBoxActions)}*/}
                        {/*            disabled={hasError || isLoading}*/}
                        {/*            getColumns={this.getColumns}*/}
                        {/*            getSelectDistinctOptions={this.getSelectDistinctOptions}*/}
                        {/*            mergeValues={false}*/}
                        {/*            onChange={this.omniBoxChange}*/}
                        {/*            values={actionValues}*/}
                        {/*        />*/}
                        {/*    </div>*/}
                        {/*)}*/}

                        {(loadingMessage || allowSelections) && (
                            <div className="grid-panel__info">
                                {loadingMessage && (
                                    <div className="grid-panel__loading">
                                        <LoadingSpinner msg={loadingMessage} />
                                    </div>
                                )}
                                {allowSelections && <SelectionStatus model={model} actions={actions} />}
                                {showFilterStatus && (
                                    <FilterStatus
                                        actionValues={actionValues}
                                        onClick={this.showFilterModal}
                                        onRemove={this.removeFilter}
                                        onRemoveAll={this.removeAllFilters}
                                    />
                                )}
                            </div>
                        )}

                        <div className="grid-panel__grid">
                            {hasError && <Alert>{queryInfoError || rowsError || selectionsError}</Alert>}

                            {!hasGridError && hasData && (
                                <Grid
                                    headerCell={this.headerCell}
                                    onHeaderCellClick={this.onHeaderCellClick}
                                    showHeader={showHeader}
                                    calcWidths
                                    condensed
                                    emptyText={gridEmptyText}
                                    gridId={id}
                                    messages={fromJS(messages)}
                                    columns={this.getGridColumns()}
                                    data={model.gridData}
                                    highlightRowIndexes={this.getHighlightRowIndexes()}
                                />
                            )}
                        </div>
                    </div>
                </div>
                {showFilterModalFieldKey && (
                    <GridFilterModal
                        fieldKey={showFilterModalFieldKey}
                        selectDistinctOptions={this.getSelectDistinctOptions(undefined)}
                        initFilters={model.filterArray} // using filterArray to indicate user-defined filters only
                        model={model}
                        onApply={this.handleApplyFilters}
                        onCancel={this.closeFilterModal}
                    />
                )}
            </>
        );
    }
}

interface GridPaneWithModelBodyProps<T = {}> extends GridPanelProps<T> {
    id: string;
}

const GridPanelWithModelBodyImpl: FC<GridPaneWithModelBodyProps & InjectedQueryModels> = memo(
    ({ actions, id, queryModels, ...props }) => {
        return <GridPanel actions={actions} model={queryModels[id]} {...props} />;
    }
);

const GridPanelWithModelBody = withQueryModels<GridPaneWithModelBodyProps>(GridPanelWithModelBodyImpl);

interface GridPanelWithModelProps<T = {}> extends GridPanelProps<T> {
    queryConfig: QueryConfig;
}

/**
 * GridPanelWithModel is the same as a GridPanel component, but it takes a single QueryConfig and loads the model.
 */
export const GridPanelWithModel: FC<GridPanelWithModelProps> = memo(({ queryConfig, ...props }) => {
    const id = useMemo(() => queryConfig.id ?? createQueryModelId(queryConfig.schemaQuery), [queryConfig]);
    const queryConfigs = useMemo(() => ({ [id]: queryConfig }), [id, queryConfig]);
    return <GridPanelWithModelBody {...props} id={id} key={id} queryConfigs={queryConfigs} />;
});
