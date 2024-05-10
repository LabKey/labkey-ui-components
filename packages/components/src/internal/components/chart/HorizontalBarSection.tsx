import React, { CSSProperties, FC, memo, ReactNode } from 'react';
import classNames from 'classnames';

import { Popover } from '../../Popover';
import { OverlayTrigger } from '../../OverlayTrigger';

const DEFAULT_EMPTY_TEXT = 'No data available.';

export interface HorizontalBarData {
    backgroundColor?: string;
    className?: string;
    count: number;
    filled: boolean;
    href?: string;
    name?: string;
    percent: number;
    title: string;
    totalCount: number;
}

interface Props {
    data: HorizontalBarData[];
    emptyText?: string;
    subtitle?: React.ReactNode;
    title?: string;
}

export const HorizontalBarSection: FC<Props> = memo(props => {
    const { subtitle, title, data, emptyText } = props;
    let horizontalBars: ReactNode = <div className="horizontal-bar--empty-text">{emptyText ?? DEFAULT_EMPTY_TEXT}</div>;

    if (data?.length) {
        horizontalBars = data
            .filter(row => row.percent > 0)
            .map((row, index) => {
                const style: CSSProperties = { width: row.percent + '%', background: row.backgroundColor };
                const overlay = (
                    <Popover id="grid-cell-popover" placement="top">
                        {row.title}
                    </Popover>
                );
                return (
                    <OverlayTrigger key={index} id={index.toString()} overlay={overlay} style={style}>
                        <div
                            data-title={row.title}
                            className={classNames('horizontal-bar-part', row.className, {
                                'horizontal-bar--linked': !!row.href,
                                'horizontal-bar--open': !row.filled || !row.backgroundColor,
                            })}
                        >
                            {row.href && (
                                <a href={row.href} className="horizontal-bar--link">
                                    &nbsp;
                                </a>
                            )}
                        </div>
                    </OverlayTrigger>
                );
            });
    }

    return (
        <div className="horizontal-bar-section">
            {title && <div className="horizontal-bar--title">{title}</div>}
            <div className="horizontal-bars">{horizontalBars}</div>
            {subtitle && <div className="horizontal-bar--subtitle">{subtitle}</div>}
        </div>
    );
});
