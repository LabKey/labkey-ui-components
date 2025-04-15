import React, { CSSProperties, FC, memo } from 'react';
import classNames from 'classnames';

import { DefaultRenderer } from '../../renderers/DefaultRenderer';

import { HorizontalBarLegendData } from './utils';

const CELL_EMPTY_COLOR = 'FFFFFF';

interface Props {
    activeIndex?: number;
    emptyColor?: string;
    legendData: HorizontalBarLegendData[];
}

export const ItemsLegend: FC<Props> = memo(props => {
    const { legendData, emptyColor = CELL_EMPTY_COLOR, activeIndex } = props;

    return (
        <div className="box-viewer-legend">
            <table>
                <tbody>
                    {legendData.map((legend, index) => {
                        let icon;
                        if (legend.circleColor && legend.circleColor !== 'none') {
                            icon = (
                                <i
                                    className="color-icon__circle cell-legend-circle"
                                    style={{ backgroundColor: legend.circleColor }}
                                />
                            );
                        } else if (legend.locked) {
                            icon = (
                                <span className="cell-lock">
                                    <span className="fa fa-lock" />
                                </span>
                            );
                        }

                        const hasBackground = legend.backgroundColor !== 'none';
                        const style: CSSProperties = {
                            backgroundColor: hasBackground ? legend.backgroundColor : emptyColor,
                        };
                        if (legend.borderColor) {
                            style.border = `3px solid ${legend.borderColor}`;
                        }
                        const iconClassName = classNames('cell-legend-icon', {
                            'cell-legend-icon-margin': legend.locked,
                            'cell-legend-icon-border': hasBackground,
                            'expired-form-field': legend.expired,
                        });

                        return (
                            <tr key={`cell-legend-${index}`} className="cell-legend-row">
                                <td>
                                    <span className={iconClassName} style={style}>
                                        {icon}
                                    </span>
                                </td>
                                <td>
                                    <span
                                        className={classNames('cell-legend-label', {
                                            'bold-text': activeIndex === index,
                                        })}
                                    >
                                        {legend.legendLabel}
                                    </span>
                                </td>
                                {legend.data && (
                                    <td className="text-align-right">
                                        <span className="cell-legend-data">
                                            <DefaultRenderer data={legend.data} />
                                        </span>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
});
ItemsLegend.displayName = 'ItemsLegend';
