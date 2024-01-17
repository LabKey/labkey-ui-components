import { DataViewInfoTypes } from './constants';
import { AppURL } from './url/AppURL';

type DataViewInfoType =
    | DataViewInfoTypes.AutomaticPlot
    | DataViewInfoTypes.BarChart
    | DataViewInfoTypes.BoxAndWhiskerPlot
    | DataViewInfoTypes.CrosstabReport
    | DataViewInfoTypes.Dataset
    | DataViewInfoTypes.ParticipantReport
    | DataViewInfoTypes.PieChart
    | DataViewInfoTypes.Query
    | DataViewInfoTypes.RReport
    | DataViewInfoTypes.SampleFinderSavedSearch
    | DataViewInfoTypes.TimeChart
    | DataViewInfoTypes.XYScatterPlot
    | DataViewInfoTypes.XYSeriesLinePlot;
/**
 * IDataViewInfo is a client side implementation of the server-side class DataViewInfo. We currently only implement
 * a subset of the fields that are used by the client.
 */
export interface IDataViewInfo {
    // This is a client side only attribute. Used to navigate within a Single Page App.
    appUrl?: AppURL;
    created?: Date;
    createdBy?: string;
    description?: string;
    detailsUrl?: string;
    icon?: string;
    iconCls?: string;
    // This is actually a uuid from the looks of it, should we be more strict on the type here?
    id?: string;
    modified?: Date;
    modifiedBy?: string;
    name?: string;
    queryName?: string;
    // This is in the format of "db:953", not quite sure why we have an id and reportId.
    reportId?: string;
    // This comes directly from the API response and is a link to LK Server
    runUrl?: string;
    schemaName?: string;
    shared?: boolean;
    thumbnail?: string; // This is actually a URL, do we enforce that?
    type?: DataViewInfoType;
    viewName?: string;
    visible?: boolean;
}

export interface DataViewClientMetadata extends IDataViewInfo {
    error?: any;
    isLoaded?: boolean;
    // The attributes here are all specific to the DataViewInfo class and are not useful as part of IDataViewInfo
    isLoading?: boolean;
}

const DataViewInfoDefaultValues = {
    name: undefined,
    description: undefined,
    detailsUrl: undefined,
    runUrl: undefined,
    type: undefined,
    visible: undefined,
    id: undefined,
    reportId: undefined,
    created: undefined,
    modified: undefined,
    createdBy: undefined,
    modifiedBy: undefined,
    thumbnail: undefined,
    icon: undefined,
    iconCls: undefined,
    schemaName: undefined,
    queryName: undefined,
    shared: false,

    // Client Side only attributes
    isLoading: false,
    isLoaded: false,
    error: undefined,
};

// commented out attributes are not used in app
export class DataViewInfo {
    declare name: string;
    declare description?: string;
    declare detailsUrl: string;
    declare runUrl: string;
    declare type: DataViewInfoType;
    declare visible: boolean;
    declare id: string;
    declare reportId: string;
    declare created?: Date;
    declare modified: Date;
    declare createdBy?: string;
    declare modifiedBy?: string;
    declare thumbnail: string;
    declare icon: string;
    declare iconCls: string;
    declare shared: boolean;
    declare schemaName?: string;
    declare queryName?: string;
    declare viewName?: string;
    declare dataRegionName: string;

    // Client Side only attributes
    declare appUrl?: AppURL;
    declare isLoading: boolean;
    declare isLoaded: boolean;
    declare error: string;

    constructor(data: Partial<DataViewInfo>) {
        Object.assign(this, DataViewInfoDefaultValues, data);
    }
}
