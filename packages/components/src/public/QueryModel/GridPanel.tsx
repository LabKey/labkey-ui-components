import React, { ComponentType, FC, memo, PureComponent, ReactNode, useCallback, useMemo } from 'react';
import classNames from 'classnames';
import { fromJS, List, Set } from 'immutable';
import { Filter, Query } from '@labkey/api';

import { MenuItem, SplitButton } from 'react-bootstrap';

import {
    Actions,
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
    useServerContext,
    ViewInfo,
} from '../..';
import { GRID_SELECTION_INDEX } from '../../internal/constants';
import { DataViewInfo } from '../../internal/models';
import { headerCell, headerSelectionCell, isFilterColumnNameMatch } from '../../internal/renderers';

import { revertViewEdit, saveGridView, saveSessionGridView } from '../../internal/actions';

import { ActionValue } from './grid/actions/Action';
import { FilterAction } from './grid/actions/Filter';
import { SearchAction } from './grid/actions/Search';
import { SortAction } from './grid/actions/Sort';
import { ViewAction } from './grid/actions/View';

import { removeActionValue, replaceSearchValue } from './grid/utils';
import { Change, ChangeType } from './grid/model';

import { createQueryModelId, QueryModel } from './QueryModel';
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
import { SaveViewModal } from './SaveViewModal';

export interface GridPanelProps<ButtonsComponentProps> {
    allowSelections?: boolean;
    allowSorting?: boolean;
    allowFiltering?: boolean;
    allowViewCustomization?: boolean;
    asPanel?: boolean;
    advancedExportOptions?: { [key: string]: any };
    ButtonsComponent?: ComponentType<ButtonsComponentProps & RequiresModelAndActions>;
    buttonsComponentProps?: ButtonsComponentProps;
    ButtonsComponentRight?: ComponentType<ButtonsComponentProps & RequiresModelAndActions>;
    emptyText?: string;
    getEmptyText?: (model: QueryModel) => string;
    hasHeader?: boolean;
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
    onSaveView: () => void;
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
            onSaveView,
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
        const hasLeftButtonsComp = ButtonsComponent !== undefined;
        const hiddenWithLeftButtonsCls = classNames({ 'hidden-md hidden-sm hidden-xs': hasLeftButtonsComp });

        const paginationComp = (
            <Pagination
                {...model.paginationData}
                loadNextPage={this.loadNextPage}
                loadFirstPage={this.loadFirstPage}
                loadPreviousPage={this.loadPreviousPage}
                loadLastPage={this.loadLastPage}
                pageSizes={pageSizes}
                setPageSize={this.setPageSize}
            />
        );

        return (
            <>
                <div className="grid-panel__button-bar">
                    <div className="grid-panel__button-bar-left">
                        <div className="button-bar__section">
                            {hasLeftButtonsComp && (
                                <ButtonsComponent {...buttonsComponentProps} model={model} actions={actions} />
                            )}
                            <span className={hiddenWithLeftButtonsCls}>
                                {showFiltersButton && <FiltersButton onFilter={onFilter} />}
                            </span>
                            <span className={hiddenWithLeftButtonsCls}>
                                {showSearchInput && <SearchBox actionValues={actionValues} onSearch={onSearch} />}
                            </span>
                        </div>
                    </div>

                    <div className="grid-panel__button-bar-right">
                        <div className="button-bar__section">
                            <span className={hiddenWithLeftButtonsCls}>{paginate && paginationComp}</span>
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
                                <ViewMenu
                                    model={model}
                                    onViewSelect={onViewSelect}
                                    onSaveView={onSaveView}
                                    hideEmptyViewMenu={hideEmptyViewMenu}
                                />
                            )}
                            {ButtonsComponentRight !== undefined && (
                                <ButtonsComponentRight {...buttonsComponentProps} model={model} actions={actions} />
                            )}
                        </div>
                    </div>
                </div>

                {/*
                    This span is to show a 2nd grid button bar row in screen sizes < large which will display the
                    filter/search and pagination information so that they is room for the buttons in the 1st button bar.
                */}
                <span
                    className={classNames({
                        'visible-md visible-sm visible-xs': hasLeftButtonsComp,
                        hidden: !hasLeftButtonsComp,
                    })}
                >
                    <div className="grid-panel__button-bar margin-top">
                        <div className="grid-panel__button-bar-left">
                            <div className="button-bar__section">
                                {showFiltersButton && <FiltersButton onFilter={onFilter} iconOnly />}
                                {showSearchInput && <SearchBox actionValues={actionValues} onSearch={onSearch} />}
                            </div>
                        </div>
                        <div className="grid-panel__button-bar-right">
                            <div className="button-bar__section">{paginate && paginationComp}</div>
                        </div>
                    </div>
                </span>
            </>
        );
    }
}

interface GridTitleProps {
    title?: string;
    model: QueryModel;
    actions: Actions;
    allowSelections: boolean;
    allowViewCustomization: boolean;
    onRevertView?: () => void;
    onSaveView?: () => void;
    onSaveNewView?: () => void;
    view?: ViewInfo;
    isUpdated?: boolean
}

export const GridTitle: FC<GridTitleProps> = memo(props => {
    const {
        title,
        view,
        model,
        onRevertView,
        onSaveView,
        onSaveNewView,
        actions,
        allowSelections,
        allowViewCustomization,
        isUpdated
    } = props;
    const { queryInfo, viewName } = model;

    let displayTitle = title;
    let currentView = view;

    if (!currentView) {
        if (viewName) {
            currentView = queryInfo.views.get(viewName.toLowerCase());
        }
        else {
            currentView = queryInfo?.views.get(ViewInfo.DEFAULT_NAME.toLowerCase());
        }
    }
    if (!currentView?.hidden && viewName) {
        const label = currentView?.label ?? viewName;
        displayTitle = displayTitle ? displayTitle + ' - ' + label : label;
    }

    const isEdited = currentView?.session && !currentView?.hidden;
    const showSave = allowViewCustomization && isEdited && currentView?.savable;
    const showRevert = allowViewCustomization && isEdited && currentView?.revertable;
    let canSaveCurrent = false;
    if (!!viewName)
        canSaveCurrent = true;
    else if (isEdited)
        canSaveCurrent = useServerContext().user.hasAdminPermission();

    if (!displayTitle && !isEdited && !isUpdated) {
        return null;
    }

    const _revertViewEdit = useCallback(async () => {
        await revertViewEdit(model.schemaQuery, model.containerPath, model.viewName);
        await actions.loadModel(model.id, allowSelections);
        onRevertView?.();
    }, [model, onRevertView, actions, allowSelections]);

    return (
        <div className="panel-heading view-header">
            {isEdited && <span className="alert-info view-edit-alert">Edited</span>}
            {isUpdated && <span className="alert-info view-edit-alert">Updated</span>}
            {displayTitle ?? 'Default View'}
            {showRevert && (
                <button className="btn btn-default button-left-spacing" onClick={_revertViewEdit}>
                    Undo
                </button>
            )}
            {showSave && !canSaveCurrent && (
                <button className="btn btn-success button-left-spacing" onClick={onSaveView}>
                    Save
                </button>
            )}
            {showSave && canSaveCurrent && (
                <SplitButton id="saveViewDropdown" bsStyle="success" onClick={onSaveView} title="Save">
                    <MenuItem title="Save as new view" onClick={onSaveNewView} key="saveNewGridView">
                        Save as
                    </MenuItem>
                </SplitButton>
            )}
        </div>
    );
});

interface State {
    actionValues: ActionValue[];
    showFilterModalFieldKey: string;
    showSaveViewModal: boolean;
    headerClickCount: { [key: string]: number };
    errorMsg: React.ReactNode;
    isViewSaved?: boolean
}

/**
 * Render a QueryModel as an interactive grid. For in-depth documentation and examples see components/docs/QueryModel.md.
 */
export class GridPanel<T = {}> extends PureComponent<Props<T>, State> {
    static defaultProps = {
        allowSelections: true,
        allowSorting: true,
        allowFiltering: true,
        allowViewCustomization: true,
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
        showSampleComparisonReports: false,
        showSearchInput: true,
        showViewMenu: true,
        showHeader: true
    };

    constructor(props) {
        super(props);
        const { id } = props.model;

        this.gridActions = {
            filter: new FilterAction(id, this.getColumns, null, props.getFilterDisplayValue),
            search: new SearchAction(id),
            sort: new SortAction(id, this.getColumns),
            view: new ViewAction(id, this.getColumns, this.getQueryInfo),
        };

        this.state = {
            actionValues: [],
            showFilterModalFieldKey: undefined,
            showSaveViewModal: false,
            headerClickCount: {},
            errorMsg: undefined,
            isViewSaved: false
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
            this.populateGridActions();
        }
    }

    gridActions: {
        filter: FilterAction;
        search: SearchAction;
        sort: SortAction;
        view: ViewAction;
    };

    createGridActionValues = (): ActionValue[] => {
        const { model } = this.props;
        const { filterArray, sorts } = model;
        const actionValues = [];

        sorts.forEach((sort): void => {
            const column = model.getColumn(sort.fieldKey);
            actionValues.push(this.gridActions.sort.actionValueFromSort(sort, column?.shortCaption));
        });

        filterArray.forEach((filter): void => {
            const column = model.getColumn(filter.getColumnName());

            if (filter.getColumnName() === '*') {
                actionValues.push(this.gridActions.search.actionValueFromFilter(filter));
            } else {
                actionValues.push(this.gridActions.filter.actionValueFromFilter(filter, column));
            }
        });

        return actionValues;
    };

    /**
     * Populates the grid with ActionValues based on the current model state. Requires that the model has a QueryInfo
     * so we can properly render Column and View labels.
     */
    populateGridActions = (): void => {
        const modelActionValues = this.createGridActionValues();
        const modelActionValuesStr = actionValuesToString(modelActionValues);
        const currentActionValuesStr = actionValuesToString(this.state.actionValues);

        if (modelActionValuesStr !== currentActionValuesStr) {
            // The action values have changed due to external model changes (likely URL changes), so we need to
            // update the actionValues state with the newest values.
            this.setState({ actionValues: modelActionValues, errorMsg: undefined });
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

    getColumns = (all = false): List<QueryColumn> => {
        const { model } = this.props;
        return all ? List(model.allColumns) : List(model.displayColumns);
    };

    getQueryInfo = (): QueryInfo => {
        return this.props.model.queryInfo;
    };

    getSelectDistinctOptions = (column: string, allFilters = true): Query.SelectDistinctOptions => {
        const { model } = this.props;
        return {
            column,
            containerFilter: model.containerFilter,
            containerPath: model.containerPath,
            schemaName: model.schemaName,
            queryName: model.queryName,
            viewName: model.viewName,
            filterArray: allFilters ? model.filters : model.modelFilters,
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

        // Defer model updates after localState is updated so we don't unnecessarily repopulate the grid actionValues
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
                showSaveViewModal: false,
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

        // Defer sorts update to after setState is complete so we don't unnecessarily repopulate the grid actionValues
        this.setState({ actionValues, headerClickCount: {} }, updateSortsCallback);
    };

    handleSearchChange = (actionValues: ActionValue[], change: Change): void => {
        const { model, actions, allowSelections } = this.props;
        let newFilters = model.filterArray;

        if (!change) return;

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

        // Defer search update to after setState so we don't unnecessarily repopulate the grid actionValues
        this.setState({ actionValues, headerClickCount: {} }, () =>
            actions.setFilters(model.id, newFilters, allowSelections)
        );
    };

    onSearch = (value: string): void => {
        const { actionValues, change } = replaceSearchValue(this.state.actionValues, value, this.gridActions.search);
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
            // actionValues only passes view name not label, so we need to extract the view label.
            const viewLabel = model.queryInfo.views.get(newValue.toLowerCase())?.label ?? newValue;

            if (newValue !== model.viewName) {
                // Only trigger view change if the viewName has changed
                updateViewCallback = () => actions.setView(model.id, newValue, allowSelections);
            }

            actionValues = [...actionValues.slice(0, actionValues.length - 1), { ...newActionValue, value: viewLabel }];
        }
        // Defer view update to after setState so we don't unnecessarily repopulate the grid actionValues
        this.setState(
            {
                actionValues,
                headerClickCount: {}, // view change will refresh the grid, so clear the headerClickCount values
            },
            updateViewCallback
        );
    };

    onRevertView = () => {
        this.setState({ errorMsg: undefined });
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
                    actionValue.action === this.gridActions.filter &&
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
            return actionValue.action === this.gridActions.filter;
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
     * Handler called when the user clicks a sort action from a column dropdown menu. Creates a grid actionValue style
     * change event and triggers handleSortChange.
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
                action: this.gridActions.sort,
            };
            const actionValues = this.state.actionValues.concat(actionValue);

            this.handleSortChange(actionValues, { type: ChangeType.add });
        } else {
            let actionIndex = -1;
            const newActionValues = this.state.actionValues.filter((actionValue, i) => {
                if (actionValue.action === this.gridActions.sort && actionValue.valueObject.fieldKey === fieldKey) {
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

    hideColumn = (columnToHide: QueryColumn): void => {
        const { actions, model, allowSelections } = this.props;

        const columns = model.displayColumns.filter(column => column.index !== columnToHide.index);
        saveSessionGridView(model.schemaQuery, columns, model.containerPath, model.viewName)
            .then(() => {
                actions.loadModel(model.id, allowSelections);
                this.setState({
                    headerClickCount: {},
                    errorMsg: undefined,
                });
            })
            .catch(errorMsg => {
                this.setState({ errorMsg });
            });
    };

    onSaveCurrentView = (): void => {
        const { actions, model, allowSelections } = this.props;
        saveGridView(model.schemaQuery, model.displayColumns, model.containerPath, model.viewName)
            .then(() => {
                actions.loadModel(model.id, allowSelections);
                this.showViewSavedIndicator();
            })
            .catch(errorMsg => {
                this.setState({ errorMsg });
            });
    };

    onSaveNewView = (): void => {
        this.setState({ showSaveViewModal: true });
    };

    onSaveView = (name: string, inherit: boolean, replace: boolean, shared: boolean): Promise<any> => {
        const { model, actions, allowSelections } = this.props;

        return new Promise((resolve, reject) => {
            saveGridView(model.schemaQuery, model.displayColumns, model.containerPath, name, false, inherit, replace, shared)
                .then(response => {
                    actions.loadModel(model.id, allowSelections);
                    resolve(response);
                })
                .catch(errorMsg => {
                    reject(errorMsg);
                });
        });
    };

    onSaveNewViewComplete = (viewName: string): void => {
        this.closeSaveViewModal();
        this.onViewSelect(viewName);
        this.showViewSavedIndicator();
    };

    showViewSavedIndicator = (): void => {
        this.setState({
            isViewSaved: true
        });

        setTimeout(() => {
            this.setState({
                isViewSaved: false
            });
        }, 5000);

    };

    closeSaveViewModal = (): void => {
        this.setState({ showSaveViewModal: false });
    };

    /**
     * Handler for the ViewSelectorComponent. Creates a grid style change event and triggers handleViewChange.
     * @param viewName: the view name selected by the user.
     */
    onViewSelect = (viewName: string): void => {
        const actionValue = { value: viewName, action: this.gridActions.view };
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
        const { allowSelections, allowSorting, allowFiltering, allowViewCustomization, model } = this.props;
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
            allowViewCustomization ? this.hideColumn : undefined,
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
            allowViewCustomization,
            hasHeader,
            asPanel,
            emptyText,
            getEmptyText,
            model,
            onExport,
            showButtonBar,
            showFilterStatus,
            showHeader,
            title,
        } = this.props;
        const { showFilterModalFieldKey, showSaveViewModal, actionValues, errorMsg, isViewSaved } = this.state;
        const {
            hasData,
            id,
            isLoading,
            isLoadingSelections,
            rowsError,
            selectionsError,
            messages,
            queryInfoError,
            queryInfo,
        } = model;
        const hasGridError = queryInfoError !== undefined || rowsError !== undefined;
        const hasError = hasGridError || selectionsError !== undefined || errorMsg;
        let loadingMessage;
        const gridIsLoading = !hasGridError && isLoading;
        const selectionsAreLoading = !hasError && allowSelections && isLoadingSelections;

        if (gridIsLoading) {
            loadingMessage = 'Loading data...';
        } else if (selectionsAreLoading) {
            loadingMessage = 'Loading selections...';
        }

        const gridEmptyText = getEmptyText?.(model) ?? emptyText;
        let view;
        if (model.viewName) {
            view = queryInfo.views.get(model.viewName.toLowerCase());
        } else {
            view = queryInfo?.views?.get(ViewInfo.DEFAULT_NAME.toLowerCase());
        }

        return (
            <>
                <div className={classNames('grid-panel', { panel: asPanel, 'panel-default': asPanel })}>
                    <GridTitle
                        model={model}
                        view={view}
                        title={title}
                        actions={actions}
                        allowSelections={allowSelections}
                        allowViewCustomization={allowViewCustomization}
                        onRevertView={this.onRevertView}
                        onSaveView={this.onSaveCurrentView}
                        onSaveNewView={this.onSaveNewView}
                        isUpdated={isViewSaved}
                    />

                    <div
                        className={classNames('grid-panel__body', { 'panel-body': asPanel, 'top-spacing': !hasHeader })}
                    >
                        {showButtonBar && (
                            <ButtonBar
                                {...this.props}
                                actionValues={actionValues}
                                onExport={onExport}
                                onFilter={this.showFilterModal}
                                onSearch={this.onSearch}
                                onViewSelect={this.onViewSelect}
                                onSaveView={this.onSaveNewView}
                            />
                        )}

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
                            {hasError && <Alert>{errorMsg || queryInfoError || rowsError || selectionsError}</Alert>}

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
                        selectDistinctOptions={this.getSelectDistinctOptions(undefined, false)}
                        initFilters={model.filterArray} // using filterArray to indicate user-defined filters only
                        model={model}
                        onApply={this.handleApplyFilters}
                        onCancel={this.closeFilterModal}
                    />
                )}
                {showSaveViewModal && (
                    <SaveViewModal
                        gridLabel={queryInfo?.schemaQuery?.queryName}
                        currentView={view}
                        onCancel={this.closeSaveViewModal}
                        onConfirmSave={this.onSaveView}
                        afterSave={this.onSaveNewViewComplete}
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
