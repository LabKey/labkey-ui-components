import React, { PureComponent } from 'react';
import { MenuItem } from 'react-bootstrap';

import { DataViewInfo } from '../../models';

interface ChartMenuItemProps {
    chart: DataViewInfo;
    showChart: (chart: DataViewInfo) => void;
}

export class ChartMenuItem extends PureComponent<ChartMenuItemProps> {
    render() {
        const { chart, showChart } = this.props;

        return (
            <MenuItem onSelect={() => showChart(chart)}>
                <i className={`chart-menu-icon ${chart.iconCls}`} />
                <span className="chart-menu-label">{chart.name}</span>
            </MenuItem>
        );
    }
}
