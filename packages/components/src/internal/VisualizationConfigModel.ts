import { List, Record } from 'immutable';
import { Query } from '@labkey/api';

export class ChartConfigModel extends Record({
    geomOptions: undefined,
    height: undefined,
    labels: undefined,
    measures: undefined,
    pointType: undefined,
    renderType: undefined,
    scales: undefined,
    width: undefined,
}) {
    geomOptions: any;
    height: number;
    labels: any;
    measures: any;
    pointType: string;
    renderType: string;
    scales: any;
    width: number;
}

export class QueryConfigModel extends Record({
    columns: undefined,
    containerPath: undefined,
    // dataRegionName: undefined,
    filterArray: undefined,
    maxRows: undefined,
    method: undefined,
    parameters: undefined,
    // queryLabel: undefined,
    queryName: undefined,
    requiredVersion: undefined,
    schemaName: undefined,
    // sort: undefined,
    viewName: undefined,
}) {
    columns: List<string>;
    containerPath: string;
    // dataRegionName: string;
    filterArray: List<any>;
    maxRows: number;
    method: string;
    parameters: any;
    // queryLabel: string;
    queryName: string;
    requiredVersion: string;
    schemaName: string;
    // sort: string;
    viewName: string;
}

export class VisualizationConfigModel extends Record({
    queryConfig: undefined,
    chartConfig: undefined,
}) {
    queryConfig: QueryConfigModel;
    chartConfig: ChartConfigModel;

    static create(raw: any): VisualizationConfigModel {
        return new VisualizationConfigModel(
            Object.assign({}, raw, {
                chartConfig: new ChartConfigModel(raw.chartConfig),
                queryConfig: new QueryConfigModel(raw.queryConfig),
            })
        );
    }
}

export function getVisualizationConfig(reportId: string): Promise<VisualizationConfigModel> {
    return new Promise((resolve, reject) => {
        Query.Visualization.get({
            reportId,
            name: undefined,
            schemaName: undefined,
            queryName: undefined,
            success: response => {
                resolve(VisualizationConfigModel.create(response.visualizationConfig));
            },
            failure: reject,
        });
    });
}
