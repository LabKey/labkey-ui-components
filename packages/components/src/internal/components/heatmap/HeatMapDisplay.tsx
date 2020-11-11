/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { FC, memo, ReactNode, useMemo } from 'react';
import { List, Map, Set } from 'immutable';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

import { HeatMapCell, HeatMapDisplayCell, HeatMapProps } from './HeatMap';
import { naturalSort } from '../../..';

const applySort = (sortFn, labels: Set<string>): Set<string> => {
    let sorted;

    if (typeof sortFn === 'function') {
        sorted = labels.sort(sortFn);
    }
    else {
        sorted = labels.sort(naturalSort);
    }

    return sorted;
}

interface HeatMapDisplayProps extends HeatMapProps {
    data: HeatMapCell[];
    displayMeasure?: boolean;
    onCellClick?: Function;
    onHeaderClick?: Function;
    xSort?: Function;
    ySort?: Function;
    yAxisColumns: { [key: string]: HeatMapDisplayCell };
    yTotalCellRenderer?: (cell: HeatMapDisplayCell) => ReactNode
}

export const HeatMapDisplay: FC<HeatMapDisplayProps> = memo((props) => {
    const { data, xAxis, yAxis, measure, xSort, ySort, onCellClick, emptyDisplay, onHeaderClick, yTotalCellRenderer,
        yTotalLabel, yInRangeTotal, yAxisColumns, nounSingular, nounPlural, displayMeasure } = props;

    const processedData = useMemo(() => {
        const rows = [];
        let xLabels = Set<string>();
        let yLabels = Set<string>();
        let measureMap = Map<string, HeatMapCell>();

        if (!data) {
            return;
        }

        data.map(cell => {
            const x = cell[xAxis];
            const y = cell[yAxis];

            xLabels = xLabels.add(x);
            yLabels = yLabels.add(y);
            measureMap = measureMap.set(x + '---' + y, cell);
        });

        const maxCell = measureMap.maxBy(cell => cell[measure]);
        let max = 0;
        if (maxCell) {
            max = maxCell[measure];
        }

        const xLabelsSorted = applySort(xSort, xLabels);
        const yLabelsSorted = applySort(ySort, yLabels);

        yLabelsSorted.map(yLabel => {
            let row = List([
                {
                    value: yLabel,
                    style: {},
                    onClick: undefined,
                },
            ]);

            xLabelsSorted.map(xLabel => {
                const cell = measureMap.get(xLabel + '---' + yLabel);
                const value = cell ? cell[measure] : 0;
                const title = cell?.title;
                const opacity = max > 0 ? Math.max(0.12, value / max) : 0;
                const _cell = {
                    value,
                    title,
                    style: {
                        background: value === 0 ? '#F6F6F6' : '#779E47',
                        opacity: value === 0 ? 1 : opacity,
                        cursor: value === 0 ? 'default' : 'pointer',
                        width: '100%',
                        height: '100%',
                    },
                    onClick: undefined,
                };

                if (typeof onCellClick === 'function') {
                    _cell.onClick = () => {
                        onCellClick(cell);
                    };
                }

                row = row.push(_cell);
            });
            rows.push(row);
        });

        return {
            headers: xLabelsSorted,
            rows: List(rows),
        };
    }, [data, xAxis, yAxis, measure, xSort, ySort, onCellClick]);

    const renderNoData = (): JSX.Element => {
        return <div>{emptyDisplay || 'No data available.'}</div>;
    }

    if (!processedData)
        return renderNoData();

    const {headers, rows} = processedData;
    const headersArray = headers.toArray();
    let yCell;

    if (rows.size === 0) {
        return renderNoData();
    }

    return (
        <div className="table-responsive">
            <table className="table heatmap-container">
                <thead>
                <tr>
                    <th style={{borderBottom: 'none', width: '16%'}}/>
                    {headers.toArray().map((header: string, i: number) => (
                        <th
                            key={i}
                            onClick={onHeaderClick ? onHeaderClick.bind(this, header, data, i) : null}
                            style={
                                onHeaderClick
                                    ? {borderBottom: 'none', cursor: 'pointer'}
                                    : {borderBottom: 'none'}
                            }
                        >
                            <div>
                                <span style={{color: '#888888', fontWeight: 'normal'}}>{header}</span>
                            </div>
                        </th>
                    ))}
                    {yTotalCellRenderer || yInRangeTotal ? (
                        <th
                            style={{
                                borderBottom: 'none',
                                width: '16%',
                                color: '#888888',
                                fontWeight: 'normal',
                            }}
                        >
                            {yTotalLabel || 'Totals'}
                        </th>
                    ) : null}
                </tr>
                </thead>
                <tbody>
                {rows.map((row: List<any>, r) => {
                    return (
                        <tr key={r}>
                            {row.map((cell, c) => {
                                if (c == 0)
                                {
                                    yCell = yAxisColumns[cell.value];
                                    return (
                                        <td
                                            key={c}
                                            style={{
                                                borderTop: 'none',
                                                background: r % 2 == 1 ? '#f9f9f9' : 'white',
                                                width: '16%',
                                                textAlign: 'right',
                                                wordWrap: 'break-word',
                                                height: '35px',
                                            }}
                                        >
                                            <div>{yCell.renderYCell(yCell)}</div>
                                        </td>
                                    );
                                }

                                const overlay = (
                                    <Tooltip id={'heatmap-cell-tooltip-' + r + '-' + c}>
                                        {(cell.value
                                            ? cell.value + ' ' + (cell.value == 1 ? nounSingular : nounPlural)
                                            : 'No ' + nounPlural) +
                                        ' for ' +
                                        cell.title}
                                    </Tooltip>
                                );

                                return (
                                    <OverlayTrigger
                                        key={c}
                                        overlay={overlay}
                                        placement="bottom"
                                        delayShow={300}
                                        delayHide={10}
                                    >
                                        <td
                                            onClick={cell.onClick}
                                            className="heat-map--cell"
                                            style={{width: '6%', height: '35px', padding: '0px'}}
                                            headers={headersArray[c - 1]}
                                        >
                                            <div style={cell.style}>{displayMeasure ? cell.value : null}</div>
                                        </td>
                                    </OverlayTrigger>
                                );
                            })}

                            {yTotalCellRenderer || yInRangeTotal ? (
                                <td style={{borderTop: 'none', height: '35px'}}>
                                    {yCell
                                        ? yTotalCellRenderer
                                            ? yTotalCellRenderer(yCell)
                                            : yCell.yInRangeTotal
                                        : 'Unknown'}
                                </td>
                            ) : null}
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
});
