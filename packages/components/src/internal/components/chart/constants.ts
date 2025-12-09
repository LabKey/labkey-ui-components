export const HIDDEN_CHART_TYPES = ['time_chart'];
export const MAX_ROWS_PREVIEW = 10000;
export const MAX_POINT_DISPLAY = 10000;
export const BLUE_HEX_COLOR = '3366FF';
export const ICONS = {
    bar_chart: 'fa-bar-chart',
    box_plot: 'box_plot_icon.svg',
    line_plot: 'fa-line-chart',
    pie_chart: 'fa-pie-chart',
    scatter_plot: 'scatter_plot_icon.svg',
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

// see vis/src/scale.js for options
export const COLOR_PALETTE_OPTIONS = [
    { label: 'Light (Default)', value: 'ColorDiscrete' },
    { label: 'Dark', value: 'DarkColorDiscrete' },
];

// see vis/src/scale.js for options
export const SHAPE_OPTIONS = [
    { label: 'Circle', value: 'circle' },
    { label: 'Diamond', value: 'diamond' },
    { label: 'Square', value: 'square' },
    { label: 'Triangle', value: 'triangle' },
    { label: 'Cross', value: 'x' },
];

export const COLOR_OPTIONS_PER_TYPE = {
    boxFillColor: ['bar_chart', 'box_plot'],
    colorPaletteScale: ['bar_chart', 'box_plot', 'line_plot', 'scatter_plot', 'pie_chart'],
    lineColor: ['bar_chart', 'box_plot'],
    pointFillColor: ['box_plot', 'line_plot', 'scatter_plot'],
};
