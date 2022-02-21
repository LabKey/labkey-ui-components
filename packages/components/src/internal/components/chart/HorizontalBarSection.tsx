import React, { FC, memo } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import classNames from 'classnames';

const DEFAULT_EMPTY_TEXT = 'No data available.';

export interface HorizontalBarData {
    percent: number;
    count: number;
    totalCount: number;
    backgroundColor?: string;
    name?: string;
    title: string;
    href?: string;
    className?: string;
    filled: boolean;
}

interface Props {
    title?: string;
    subtitle?: React.ReactNode;
    emptyText?: string;
    data: HorizontalBarData[];
}

export const HorizontalBarSection: FC<Props> = memo(props => {
    const { subtitle, title, data, emptyText } = props;
    const horizontalBars = [];

    if (data?.length) {
        let hasBegun = false;
        const dataCount = data.length;
        data.forEach((row, index) => {
            if (row.percent > 0) {
                const pct = row.percent;
                const styleProps = {
                    width: pct + '%',
                };
                if (row.backgroundColor) {
                    styleProps['background'] = row.backgroundColor;
                }
                horizontalBars.push(
                    <OverlayTrigger
                        key={index}
                        overlay={
                            <Popover bsClass="popover" id="grid-cell-popover">
                                {row.title}
                            </Popover>
                        }
                        placement="top"
                    >
                        <div
                            key={index}
                            style={styleProps}
                            data-title={row.title}
                            className={classNames('horizontal-bar-part', row.className, {
                                'horizontal-bar--begin': !hasBegun,
                                'horizontal-bar--filled': row.filled,
                                'horizontal-bar--linked': !!row.href,
                                'horizontal-bar--open': !row.filled || !row.backgroundColor,
                                'horizontal-bar--end': index === dataCount - 1,
                            })}
                        >
                            {row.href && (
                                <a href={row.href} className="horizontal-bar--link">
                                    <div className="horizontal-bar--linkSpanner">&nbsp;</div>
                                </a>
                            )}
                        </div>
                    </OverlayTrigger>
                );
                hasBegun = true;
            }
        });
    } else {
        horizontalBars.push(<div className="horizontal-bar--empty-text">{emptyText ?? DEFAULT_EMPTY_TEXT}</div>);
    }

    return (
        <table className="horizontal-bar-section">
            <tbody>
                <tr>
                    {title && <td className="horizontal-bar--title">{title}</td>}
                    <td>{horizontalBars}</td>
                </tr>
                {subtitle && (
                    <tr>
                        <td className="horizontal-bar--subtitle" colSpan={2}>
                            {subtitle}
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
});
