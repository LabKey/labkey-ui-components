import React, { FC, memo, useCallback, useMemo } from 'react';
import { Utils, UtilsDOM } from '@labkey/api';

import { Row } from '../../query/selectRows';
import { GridColumn } from '../base/models/GridColumn';
import { Grid } from '../base/Grid';
import { List as ImmutableList } from 'immutable';
import { naturalSortByProperty } from '../../../public/sort';
import { DropdownButton, MenuHeader, MenuItem } from '../../dropdowns';

enum DelimiterType {
    COMMA = 'COMMA',
    EXCEL = 'EXCEL',
    TAB = 'TAB',
}

// Equivalent to what we're doing when generating the hoverText in GenericChartHelper generateTrendlinePathHover
const roundedCell = (value: number) => Utils.roundNumber(value, 4);
const MIN_COL = new GridColumn({ index: 'min', title: 'Min', cell: roundedCell });
const MAX_COL = new GridColumn({ index: 'max', title: 'Max', cell: roundedCell });
const ASYMMETRY_COLUMN = new GridColumn({ index: 'asymmetry', title: 'Asymmetry' });
const INFLECTION_COLUMN = new GridColumn({ index: 'inflection', title: 'Inflection', cell: roundedCell });
const R_SQUARED_COLUMN = new GridColumn({ index: 'RSquared', title: 'R-Squared', cell: roundedCell });
const ADJUSTED_R_SQUARED_COLUMN = new GridColumn({
    index: 'adjustedRSquared',
    title: 'Adjusted R-Squared',
    cell: roundedCell,
});
const RSS_COLUMN = new GridColumn({ index: 'RSS', title: 'TSS', cell: roundedCell });
const TSS_COLUMN = new GridColumn({ index: 'TSS', title: 'TSS', cell: roundedCell });
const RMSE_COLUMN = new GridColumn({ index: 'RMSE', title: 'RMSE', cell: roundedCell });
const SLOPE_COLUMN = new GridColumn({ index: 'slope', title: 'Slope', cell: roundedCell });
const INTERCEPT_COLUMN = new GridColumn({ index: 'intercept', title: 'Intercept', cell: roundedCell });
const COEFFICIENT_1_COLUMN = new GridColumn({ index: 'coefficient1', title: 'Coefficient 1', cell: roundedCell });
const COEFFICIENT_2_COLUMN = new GridColumn({ index: 'coefficient2', title: 'Coefficient 2', cell: roundedCell });
const COEFFICIENT_3_COLUMN = new GridColumn({ index: 'coefficient3', title: 'Coefficient 3', cell: roundedCell });
const STATS_COLUMNS = [RSS_COLUMN, TSS_COLUMN, RMSE_COLUMN, R_SQUARED_COLUMN];
const NONLINEAR_COLUMNS = [
    MIN_COL,
    MAX_COL,
    ASYMMETRY_COLUMN,
    INFLECTION_COLUMN,
    ...STATS_COLUMNS,
    ADJUSTED_R_SQUARED_COLUMN,
];
const LINEAR_REGRESSION_COLUMNS = [SLOPE_COLUMN, INTERCEPT_COLUMN, ...STATS_COLUMNS];
const POLYNOMIAL_COLUMNS = [COEFFICIENT_1_COLUMN, COEFFICIENT_2_COLUMN, COEFFICIENT_3_COLUMN, ...STATS_COLUMNS];

interface GeneratedPoint {
    x: number;
    y: number;
}

interface CurveFitStats {
    RMSE: number;
    RSquared: number;
    RSS: number;
    TSS: number;
}

interface NonlinearCurveFitStats extends CurveFitStats {
    adjustedRSquared: number;
}

interface CurveFit {
    type: string;
}

interface PolynomialCurveFitData {
    coefficients: number[];
}

interface PolynomialCurveFit extends CurveFit, PolynomialCurveFitData {
    type: 'Polynomial';
}

interface LinearRegressionCurveFitData {
    intercept: number;
    slope: number;
}

interface LinearRegressionCurveFit extends CurveFit, LinearRegressionCurveFitData {
    type: 'Linear';
}

// Note: most nonlinear curve fits also have a fitError attribute, however we are ignoring that because it's just RMSE
// or R-Squared.
interface NonlinearCurveFitData {
    asymmetry: number;
    inflection: number;
    max: number;
    min: number;
}

interface NonlinearCurveFit extends CurveFit, NonlinearCurveFitData {
    type: '3 Parameter' | '4 Parameter' | 'Five Parameter' | 'Four Parameter' | 'Three Parameter';
}

interface CurveFitData<T extends CurveFit, S extends CurveFitStats> {
    curveFit: T;
    generatedPoints: GeneratedPoint[];
    stats: S;
}

interface Trendline<T extends CurveFit, S extends CurveFitStats = CurveFitStats> {
    count: number;
    data: CurveFitData<T, S>;
    generatedPoints: GeneratedPoint[];
    name: string;
    rawData: Row[];
    total: number;
}

interface BaseCurveFitRow extends CurveFitStats {
    series: string;
}

interface PolynomialCurveFitRow extends BaseCurveFitRow {
    coefficient1: number;
    coefficient2: number;
    coefficient3: number;
}

type LinearRegressionCurveFitRow = BaseCurveFitRow & LinearRegressionCurveFitData;
type NonlinearCurveFitRow = BaseCurveFitRow & NonlinearCurveFitData & NonlinearCurveFitStats;
type CurveFitRow = LinearRegressionCurveFitRow | NonlinearCurveFitRow | PolynomialCurveFitRow;
type PossibleTrendlines =
    | Trendline<LinearRegressionCurveFit>
    | Trendline<NonlinearCurveFit, NonlinearCurveFitStats>
    | Trendline<PolynomialCurveFit>;

const nonLinearTrendlineTypes = ['3 Parameter', '4 Parameter', 'Five Parameter', 'Four Parameter', 'Three Parameter'];
function isNonlinearTrendline(
    trendline: PossibleTrendlines
): trendline is Trendline<NonlinearCurveFit, NonlinearCurveFitStats> {
    const type = trendline.data.curveFit.type;
    return nonLinearTrendlineTypes.includes(type);
}

function trendLineToCurveFitRow(trendline: PossibleTrendlines): CurveFitRow {
    const { curveFit, stats } = trendline.data;
    const series = trendline.name;

    if (curveFit.type === 'Polynomial') {
        return {
            ...stats,
            series,
            coefficient1: curveFit.coefficients[0],
            coefficient2: curveFit.coefficients[1],
            coefficient3: curveFit.coefficients[2],
        };
    }

    if (curveFit.type === 'Linear') {
        const { intercept, slope } = curveFit;
        return { ...stats, series, intercept, slope };
    }

    if (isNonlinearTrendline(trendline)) {
        const { asymmetry, inflection, max, min } = curveFit;
        return { ...(stats as NonlinearCurveFitStats), series, asymmetry, inflection, max, min };
    }

    return undefined;
}

const STATS_EXPORT_COLS = ['RSS', 'TSS', 'RMSE', 'RSquared'];
const LINEAR_EXPORT_COLS = ['slope', 'intercept', ...STATS_EXPORT_COLS];
const POLYNOMIAL_EXPORT_COLS = ['coefficient1', 'coefficient2', 'coefficient3', ...STATS_EXPORT_COLS];
const NONLINEAR_EXPORT_COLS = ['min', 'max', 'asymmetry', 'inflection', ...STATS_EXPORT_COLS, 'adjustedRSquared'];

const STATS_EXPORT_HEADERS = ['RSS', 'TSS', 'RMSE', 'R-Squared'];
const LINEAR_EXPORT_HEADERS = ['Slope', 'Intercept', ...STATS_EXPORT_HEADERS];
const POLYNOMIAL_EXPORT_HEADERS = ['Coefficient 1', 'Coefficient 2', 'Coefficient 3', ...STATS_EXPORT_HEADERS];
const NONLINEAR_EXPORT_HEADERS = [
    'Min',
    'Max',
    'Asymmetry',
    'Inflection',
    ...STATS_EXPORT_HEADERS,
    'Adjusted R-Squared',
];

/**
 * Converts CurveFitRow[] to an array of arrays as expected by convertToExcel and convertToTable
 */
function curveFitRowsToExportFormat(hasSeries: boolean, type: string, rows: CurveFitRow[]): (number | string)[][] {
    let headers = hasSeries ? ['Series'] : [];
    let cols = hasSeries ? ['series'] : [];
    if (type === 'Polynomial') {
        headers = headers.concat(POLYNOMIAL_EXPORT_HEADERS);
        cols = cols.concat(POLYNOMIAL_EXPORT_COLS);
    } else if (type === 'Linear') {
        headers = headers.concat(LINEAR_EXPORT_HEADERS);
        cols = cols.concat(LINEAR_EXPORT_COLS);
    } else {
        headers = headers.concat(NONLINEAR_EXPORT_HEADERS);
        cols = cols.concat(NONLINEAR_EXPORT_COLS);
    }

    const exportRows = rows.map((row: CurveFitRow) => {
        return cols.map(col => row[col]);
    });
    exportRows.unshift(headers);
    return exportRows;
}

type ShapeMethod = (size: number) => string;
type ScaleMethod<T> = (value: string) => T;

/**
 * This is a subset of what our scale objects look like in our Vis API. Only defining what we're using at this moment.
 */
interface PlotScale<T> {
    scale: ScaleMethod<T>;
}

/**
 * This is the subset of attributes from the object returned by new LABKEY.vis.Plot that we need in order to render the
 * curve fit statistics.
 */
interface PlotObject {
    scales: {
        color: PlotScale<string>;
        shape: PlotScale<ShapeMethod>;
    };
}

const SHAPE_SIZE = 5; // hard coded size 5 because that's what our chart legends already do

interface SeriesCellProps {
    colorScale: ScaleMethod<string>;
    series: string;
    shapeScale: ScaleMethod<ShapeMethod>;
}

const SeriesCell: FC<SeriesCellProps> = memo(({ colorScale, series, shapeScale }) => {
    const color = colorScale(series);
    const shape = shapeScale(series)(SHAPE_SIZE);
    return (
        <div className="curve-fit-series-cell">
            <svg height={15} width={15}>
                <path d={shape} fill={color} stroke={color} transform="translate(7.5, 7.5)" />
            </svg>
            <span className="margin-left-small">{series}</span>
        </div>
    );
});
SeriesCell.displayName = 'SeriesCell';

interface Props {
    name: string;
    plot: PlotObject | undefined;
    trendLineData: Trendline<LinearRegressionCurveFit>[] | Trendline<PolynomialCurveFit>[];
}

export const CurveFitStatsGrid: FC<Props> = memo(({ name, plot, trendLineData }) => {
    const type = trendLineData[0].data.curveFit.type;
    const hasSeries = !(trendLineData.length === 1 && trendLineData[0].name === 'All');
    const gridData = useMemo<CurveFitRow[]>(
        () => trendLineData.map(trendLineToCurveFitRow).sort(naturalSortByProperty('series')),
        [trendLineData]
    );
    const colorScale = plot?.scales.color;
    const shapeScale = plot?.scales.shape;

    const gridColumns = useMemo(() => {
        let seriesColumn: GridColumn;

        if (hasSeries) {
            const colConfig = { cell: undefined, index: 'series', title: 'Series' };

            if (colorScale && shapeScale) {
                colConfig.cell = (series: string) => (
                    <SeriesCell colorScale={colorScale.scale} series={series} shapeScale={shapeScale.scale} />
                );
            }

            seriesColumn = new GridColumn(colConfig);
        }

        let columns = seriesColumn ? [seriesColumn] : [];

        if (type === 'Polynomial') columns = columns.concat(POLYNOMIAL_COLUMNS);
        else if (type === 'Linear') columns = columns.concat(LINEAR_REGRESSION_COLUMNS);
        else columns = columns.concat(NONLINEAR_COLUMNS);

        return ImmutableList(columns);
    }, [type, hasSeries, colorScale, shapeScale]);

    const onExportTextFile = useCallback(
        (delimiter: DelimiterType) => {
            const exportData = curveFitRowsToExportFormat(hasSeries, type, gridData);

            if (delimiter === DelimiterType.EXCEL) {
                UtilsDOM.convertToExcel({
                    fileName: `${name}_statistics.xlsx`,
                    sheets: [
                        {
                            name: 'statistics',
                            data: exportData,
                        },
                    ],
                });
            } else {
                UtilsDOM.convertToTable({
                    fileNamePrefix: `${name}_statistics`,
                    delim:
                        delimiter === DelimiterType.COMMA ? UtilsDOM.DelimiterType.COMMA : UtilsDOM.DelimiterType.TAB,
                    rows: exportData,
                });
            }
        },
        [gridData, hasSeries, name, type]
    );
    const onExportCsv = useCallback(() => onExportTextFile(DelimiterType.COMMA), [onExportTextFile]);
    const onExportExcel = useCallback(() => onExportTextFile(DelimiterType.EXCEL), [onExportTextFile]);
    const onExportTsv = useCallback(() => onExportTextFile(DelimiterType.TAB), [onExportTextFile]);

    return (
        <div className="curve-fit-statistics">
            <div className="curve-fit-statistics__header">
                <h5 className="curve-fit-statistics__title">Statistics</h5>
                <DropdownButton
                    buttonClassName="curve-fit-statistics__dropdown-button"
                    className="curve-fit-statistics__export-menu"
                    noCaret
                    title={<span className="fa fa-download" />}
                >
                    <MenuHeader text="Export Statistics" />

                    <MenuItem onClick={onExportCsv}>
                        <span className="fa fa-file-o margin-right-small" />
                        CSV
                    </MenuItem>

                    <MenuItem onClick={onExportExcel}>
                        <span className="fa fa-file-excel-o margin-right-small" />
                        Excel
                    </MenuItem>

                    <MenuItem onClick={onExportTsv}>
                        <span className="fa fa-file-text-o margin-right-small" />
                        TSV
                    </MenuItem>
                </DropdownButton>
            </div>
            <Grid columns={gridColumns} data={gridData} />
        </div>
    );
});
CurveFitStatsGrid.displayName = 'CurveFitStatsGrid';
