import React from 'react';
import classNames from 'classnames';

import { LockIcon } from '../base/LockIcon';

import { HorizontalBarLegendData } from './utils';

const CELL_EMPTY_COLOR = 'FFFFFF';

interface Props {
    legendData: HorizontalBarLegendData[];
    emptyColor?: string;
}

export class ItemsLegend extends React.PureComponent<Props> {
    static defaultProps = {
        title: 'Container legend',
        emptyColor: CELL_EMPTY_COLOR,
        asModal: true,
    };

    render() {
        const { legendData, emptyColor } = this.props;

        const legendsDisplay = [];
        legendData.forEach((legend, index) => {
            let icon;
            if (legend.circleColor && legend.circleColor !== 'none') {
                icon = (
                    <i
                        className="color-icon__circle cell-legend-circle"
                        style={{ backgroundColor: legend.circleColor }}
                    />
                );
            } else if (legend.locked) {
                icon = <LockIcon id={index + ''} title="" iconCls="cell-lock" body="" />;
            }

            const key = 'cell-legend-' + index;
            const hasBackground = legend.backgroundColor !== 'none';
            const legendDisplay = (
                <tr key={key} className="cell-legend-row">
                    <td>
                        <span
                            className={classNames('cell-legend-icon', {
                                'cell-legend-icon-border': hasBackground,
                            })}
                            style={{ backgroundColor: hasBackground ? legend.backgroundColor : emptyColor }}
                        >
                            {icon}
                        </span>
                    </td>
                    <td>
                        <span className="cell-legend-label">{legend.legendLabel}</span>
                    </td>
                </tr>
            );

            legendsDisplay.push(legendDisplay);
        });

        return (
            <div className="box-viewer-legend">
                <table>
                    <tbody>{legendsDisplay}</tbody>
                </table>
            </div>
        );
    }
}
