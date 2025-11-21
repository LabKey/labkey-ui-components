export const HIDDEN_CHART_TYPES = ['time_chart'];
export const MAX_ROWS_PREVIEW = 10000;
export const MAX_POINT_DISPLAY = 10000;
export const BLUE_HEX_COLOR = '3366FF';
export const BAR_CHART_AGGREGATE_NAME = 'aggregate-method';
export const BAR_CHART_ERROR_BAR_NAME = 'error-bar-method';
export const ICONS = {
    bar_chart: 'bar_chart',
    box_plot: 'box_plot',
    pie_chart: 'pie_chart',
    scatter_plot: 'xy_scatter',
    line_plot: 'xy_line',
};

export const AGGREGATE_METHODS = [
    { label: 'None', value: '' },
    { label: 'Count (non-blank)', value: 'COUNT' },
    { label: 'Sum', value: 'SUM' },
    { label: 'Min', value: 'MIN' },
    { label: 'Max', value: 'MAX' },
    { label: 'Mean', value: 'MEAN' },
    { label: 'Median', value: 'MEDIAN' },
];
