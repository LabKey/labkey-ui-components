import React, { FC, memo, useMemo } from 'react';
import { Utils } from '@labkey/api';

import { Row } from '../../query/selectRows';
import { GridColumn } from '../base/models/GridColumn';
import { Grid } from '../base/Grid';
import { List as ImmutableList } from 'immutable';
import { naturalSortByProperty } from '../../../public/sort';

// Equivalent to what we're doing when generating the hoverText in GenericChartHelper generateTrendlinePathHover
const roundedCell = (value: number) => Utils.roundNumber(value, 4);
const R_SQUARED_COLUMN = new GridColumn({ index: 'RSquared', title: 'R-Squared', cell: roundedCell });
const RSS_COLUMN = new GridColumn({ index: 'RSS', title: 'TSS', cell: roundedCell });
const TSS_COLUMN = new GridColumn({ index: 'TSS', title: 'TSS', cell: roundedCell });
const RMSE_COLUMN = new GridColumn({ index: 'RMSE', title: 'RMSE', cell: roundedCell });
const SLOPE_COLUMN = new GridColumn({ index: 'slope', title: 'Slope', cell: roundedCell });
const INTERCEPT_COLUMN = new GridColumn({ index: 'intercept', title: 'Intercept', cell: roundedCell });
const COEFFICIENTS_COLUMN = new GridColumn({
    index: 'coefficients',
    title: 'Coefficients',
    cell: data => {
        return data.map((coefficient: number, idx: number) => (
            <div className="small-margin-bottom" key={idx}>
                {Utils.roundNumber(coefficient, 4)}
            </div>
        ));
    },
});
const STATS_COLUMNS = [R_SQUARED_COLUMN, RSS_COLUMN, TSS_COLUMN, RMSE_COLUMN];
const LINEAR_REGRESSION_COLUMNS = [SLOPE_COLUMN, INTERCEPT_COLUMN, ...STATS_COLUMNS];
const POLYNOMIAL_COLUMNS = [COEFFICIENTS_COLUMN, ...STATS_COLUMNS];

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

interface CurveFit {
    type: string; // change to enum or string union
}

interface PolynomialCurveFit extends CurveFit {
    coefficients: number[];
    type: 'Polynomial';
}

interface LinearRegressionCurveFit extends CurveFit {
    intercept: number;
    slope: number;
    type: 'Linear';
}

interface CurveFitData<T extends CurveFit> {
    curveFit: T;
    generatedPoints: GeneratedPoint[];
    stats: CurveFitStats;
}

interface Trendline<T extends CurveFit> {
    count: number;
    data: CurveFitData<T>;
    generatedPoints: GeneratedPoint[];
    name: string;
    rawData: Row[];
    total: number;
}

interface BaseCurveFitRow extends CurveFitStats {
    series: string;
}

interface PolynomialCurveFitRow extends BaseCurveFitRow {
    coefficients: number[];
}

interface LinearRegressionCurveFitRow extends BaseCurveFitRow {
    intercept: number;
    slope: number;
}

type CurveFitRow = LinearRegressionCurveFitRow | PolynomialCurveFitRow;

export function trendLineToCurveFitRow(
    trendline: Trendline<LinearRegressionCurveFit | PolynomialCurveFit>
): CurveFitRow {
    const { curveFit, stats } = trendline.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- type intentionally ignored
    const { type, ...curveFitRest } = curveFit;
    return {
        series: trendline.name,
        ...curveFitRest,
        ...stats,
    };
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

interface SeriesCellProps {
    colorScale: ScaleMethod<string>;
    series: string;
    shapeScale: ScaleMethod<ShapeMethod>;
}
const SeriesCell: FC<SeriesCellProps> = memo(({ colorScale, series, shapeScale }) => {
    const color = colorScale(series);
    // hard coded size 5 because that's what our chart legends already do
    const shape = shapeScale(series)(5);
    return (
        <div>
            <svg height={15} width={15}>
                <path d={shape} fill={color} stroke={color} transform="translate(7.5, 7.5)" />
            </svg>
            <span className="margin-left-small">{series}</span>
        </div>
    );
});
SeriesCell.displayName = 'SeriesCell';

interface Props {
    plot: PlotObject | undefined;
    trendLineData: Trendline<LinearRegressionCurveFit>[] | Trendline<PolynomialCurveFit>[];
}

export const CurveFitStatsGrid: FC<Props> = memo(({ plot, trendLineData }) => {
    const type = trendLineData[0].data.curveFit.type;
    const hasSeries = !(trendLineData.length === 1 && trendLineData[0].name === 'All');
    const gridData = useMemo<CurveFitRow[]>(
        () => trendLineData.map(trendLineToCurveFitRow).sort(naturalSortByProperty('series')),
        [trendLineData]
    );
    const colorScale = plot?.scales.color;
    const shapeScale = plot?.scales.shape;
    const gridColumns = useMemo(() => {
        const statColumns = type === 'Polynomial' ? POLYNOMIAL_COLUMNS : LINEAR_REGRESSION_COLUMNS;
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
        const columns = (seriesColumn ? [seriesColumn] : []).concat(statColumns);
        return ImmutableList(columns);
    }, [type, hasSeries, colorScale, shapeScale]);

    return (
        <div className="curve-fit-statistics">
            <h5 className="curve-fit-statistics__title">Statistics</h5>
            <Grid columns={gridColumns} data={gridData} />
        </div>
    );
});
CurveFitStatsGrid.displayName = 'CurveFitStatsGrid';
