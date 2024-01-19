import React, { FC, memo, PureComponent, useCallback } from 'react';
import classNames from 'classnames';
import moment from 'moment';
import { Filter, PermissionTypes, Query } from '@labkey/api';

import { getDateFormat } from '../../util/Date';

import {
    ASSAYS_KEY,
    FILE_IMPORT_SAMPLES_HREF,
    FIND_SAMPLES_BY_FILTER_HREF,
    GRID_INSERT_SAMPLES_HREF,
    SAMPLES_KEY,
} from '../../app/constants';
import { useAppContext } from '../../AppContext';

import { SAMPLE_FILTER_METRIC_AREA } from '../search/utils';

import { SchemaQuery } from '../../../public/SchemaQuery';
import { Row, selectRows } from '../../query/selectRows';
import { AppURL } from '../../url/AppURL';
import { User } from '../base/models/User';
import { Alert } from '../base/Alert';
import { getActionErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { SampleTypeEmptyAlert } from '../samples/SampleTypeEmptyAlert';
import { AssayDesignEmptyAlert } from '../assay/AssayDesignEmptyAlert';
import { Section } from '../base/Section';
import { Tip } from '../base/Tip';
import { RequiresPermission } from '../base/Permissions';

import { useServerContext } from '../base/ServerContext';

import { BarChartConfig, BarChartData, BarChartSelector } from './models';
import { BaseBarChart } from './BaseBarChart';
import { processChartData } from './utils';
import { DropdownButton, MenuItem } from '../../dropdowns';

async function fetchItemCount(schemaQuery: SchemaQuery, filterArray: Filter.IFilter[] = []): Promise<number> {
    try {
        const response = await selectRows({
            filterArray,
            maxRows: 1,
            schemaQuery,
            containerFilter: Query.ContainerFilter.currentPlusProjectAndShared, // Issue 46098
        });
        return response.rows.length;
    } catch (error) {
        console.error('Failed to fetch item count for charts', error);
    }

    return 0;
}

interface Props {
    chartConfigs: BarChartConfig[];
    containerFilter?: Query.ContainerFilter;
    dataTypeExclusions?: { [key: string]: number[] };
    navigate: (url: string | AppURL) => any;
    user: User;
}

interface State {
    currentChart: number;
    currentGroup: number;
    hasError: boolean;
    itemCounts: Record<number, number>;
    resultRows: Record<number, Row[]>;
}

export class BarChartViewer extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            currentChart: 0,
            currentGroup: 0,
            hasError: false,
            itemCounts: {},
            resultRows: {},
        };
    }

    componentDidMount(): void {
        this.loadChartData();
    }

    loadChartData = async (): Promise<void> => {
        const { containerFilter, dataTypeExclusions } = this.props;
        const { resultRows, currentGroup } = this.state;

        if (!resultRows.hasOwnProperty(currentGroup)) {
            try {
                const currentConfig = this.getSelectedChartGroup();
                const { itemCountFilters, itemCountSQ, getProjectExclusionFilter } = currentConfig;
                const projectExclusionFilter = getProjectExclusionFilter(dataTypeExclusions);

                const filters: Filter.IFilter[] = [];
                if (itemCountFilters) filters.push(...itemCountFilters);
                if (projectExclusionFilter) filters.push(projectExclusionFilter);

                const itemCount = await fetchItemCount(itemCountSQ, filters);

                const { queryName, schemaName, sort } = currentConfig;
                // default view is fine here; using custom query that is assumed not to be customized or customized
                // to specifically affect this view.
                const response = await selectRows({
                    schemaQuery: new SchemaQuery(schemaName, queryName),
                    containerFilter,
                    sort,
                    filterArray: filters,
                });

                this.setState(state => ({
                    itemCounts: { ...state.itemCounts, [currentGroup]: itemCount },
                    resultRows: { ...state.resultRows, [currentGroup]: response.rows },
                }));
            } catch (reason) {
                console.error(reason);
                this.setState({ hasError: true });
            }
        }
    };

    getSelectedChartGroup = (): BarChartConfig => {
        return this.props.chartConfigs[this.state.currentGroup];
    };

    getSelectedChartGroupCharts = (): BarChartSelector[] => {
        return this.getSelectedChartGroup().charts;
    };

    onBarClick = (evt: any, row: BarChartData): void => {
        const { getAppURL, filterDataRegionName = 'query' } = this.getSelectedChartGroup();

        if (getAppURL) {
            const chart = this.getSelectedChartGroupCharts()[this.state.currentChart];

            // apply the created date filter if the chart definition has one
            let url = getAppURL(row, evt);

            if (chart.filter !== undefined) {
                const dt = moment().add(chart.filter, 'days').format(getDateFormat().toUpperCase());
                url = url.addParam(filterDataRegionName + '.Created~dategte', dt);
            }

            this.props.navigate(url);
        }
    };

    prevChart = (): void => {
        this.selectChart(this.state.currentChart - 1);
    };

    nextChart = (): void => {
        this.selectChart(this.state.currentChart + 1);
    };

    selectChart = (index: number): void => {
        if (index < 0 || index > this.getSelectedChartGroupCharts().length - 1) {
            return;
        }

        this.setState({ currentChart: index });
    };

    selectChartGroup = (index: number): void => {
        this.setState(
            () => ({
                currentGroup: index,
                currentChart: 0,
            }),
            () => {
                this.loadChartData();
            }
        );
    };

    render() {
        const { chartConfigs, user } = this.props;
        const { resultRows, currentGroup, currentChart, hasError, itemCounts } = this.state;
        const selectedGroup = this.getSelectedChartGroup();
        const selectedCharts = this.getSelectedChartGroupCharts();
        const currentChartOptions = selectedCharts[currentChart];
        const hasSectionItems = itemCounts[currentGroup] > 0;
        const rows = resultRows[currentGroup];
        const isLoading = !rows;
        const hasData = rows?.length > 0;

        let body;
        if (hasError) {
            body = (
                <Alert>{getActionErrorMessage('There was a problem loading the chart configurations.', 'chart')}</Alert>
            );
        } else if (isLoading) {
            body = <LoadingSpinner />;
        } else if (!hasSectionItems) {
            if (selectedGroup.key === SAMPLES_KEY) {
                body = <SampleTypeEmptyAlert user={user} />;
            } else if (selectedGroup.key === ASSAYS_KEY) {
                body = <AssayDesignEmptyAlert />; // don't pass user, prevents creating assay design from alert message
            }
        } else if (!hasData) {
            if (selectedGroup.key === SAMPLES_KEY) {
                body = (
                    <Alert bsStyle="warning">
                        No samples have been created.{' '}
                        {user.hasInsertPermission() ? "Use the 'Add Samples' menu above to create samples." : ''}
                    </Alert>
                );
            } else if (selectedGroup.key === ASSAYS_KEY) {
                body = <Alert bsStyle="warning">No assay runs have been imported.</Alert>;
            }
        } else {
            const { barFillColors, data } = processChartData(rows, {
                colorPath: selectedGroup.colorPath,
                groupPath: selectedGroup.groupPath,
                countPath: [currentChartOptions.name, 'value'],
            });

            body = (
                <BaseBarChart
                    barFillColors={barFillColors}
                    data={data}
                    defaultBorderColor="#555"
                    grouped={selectedGroup.groupPath !== undefined}
                    onClick={selectedGroup.getAppURL ? this.onBarClick : undefined}
                    title={`${selectedGroup.label} (${currentChartOptions.label})`}
                />
            );
        }

        return (
            <Section
                panelClassName={isLoading || !hasData ? 'bar-chart-viewer-empty' : 'bar-chart-viewer-panel'}
                title="Dashboard Insights"
                titleSize="medium"
            >
                {!hasError && (
                    <div className="btn-group">
                        <DropdownButton title={selectedGroup.label}>
                            {chartConfigs.map(({ label }, i) => (
                                <MenuItem
                                    active={selectedGroup.label === label}
                                    key={label}
                                    onClick={() => this.selectChartGroup(i)}
                                >
                                    {label}
                                </MenuItem>
                            ))}
                        </DropdownButton>
                        {selectedCharts?.length > 1 && (
                            <DropdownButton title={currentChartOptions.label}>
                                {selectedCharts.map((chart, i) => (
                                    <MenuItem
                                        active={currentChart === i}
                                        key={chart.label}
                                        onClick={() => this.selectChart(i)}
                                    >
                                        {chart.label}
                                    </MenuItem>
                                ))}
                            </DropdownButton>
                        )}
                    </div>
                )}
                {!hasError && selectedCharts?.length > 1 && (
                    <div className="btn-group button-left-spacing pull-right">
                        <Tip caption="Previous">
                            <button
                                className="btn btn-default"
                                disabled={currentChart === 0}
                                onClick={this.prevChart}
                                type="button"
                            >
                                <i className="fa fa-chevron-left" />
                            </button>
                        </Tip>
                        <Tip caption="Next">
                            <button
                                className="btn btn-default"
                                onClick={this.nextChart}
                                disabled={currentChart === selectedCharts.length - 1}
                                type="button"
                            >
                                <i className="fa fa-chevron-right" />
                            </button>
                        </Tip>
                    </div>
                )}
                {!hasError && hasSectionItems && selectedGroup.showSampleButtons && <SampleButtons />}
                <div className="margin-top">{body}</div>
            </Section>
        );
    }
}

// export for jest testing
export const SampleButtons: FC = memo(() => {
    const { api } = useAppContext();
    const { user } = useServerContext();

    const onSampleFinder = useCallback(() => {
        api.query.incrementClientSideMetricCount(SAMPLE_FILTER_METRIC_AREA, 'dashboardButtonNavigation');
    }, [api]);

    return (
        <div className="pull-right bar-chart-viewer-sample-buttons">
            <a
                className={classNames('btn btn-primary', { 'button-right-spacing': user.canInsert })}
                href={FIND_SAMPLES_BY_FILTER_HREF.toHref()}
                onClick={onSampleFinder}
            >
                Go to Sample Finder
            </a>
            <RequiresPermission perms={PermissionTypes.Insert}>
                <DropdownButton title="Add Samples" bsStyle="success">
                    <MenuItem href={GRID_INSERT_SAMPLES_HREF.toHref()}>Add Manually</MenuItem>
                    <MenuItem href={FILE_IMPORT_SAMPLES_HREF.toHref()}>Import from File</MenuItem>
                </DropdownButton>
            </RequiresPermission>
        </div>
    );
});
