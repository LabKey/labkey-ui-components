/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map } from 'immutable';
import { Filter, Query } from '@labkey/api';

import { QueryInfo } from '../../public/QueryInfo';
import {
    DataTypeEntity,
    EntityDataType,
    FolderConfigurableDataType,
    IEntityTypeOption,
} from '../components/entities/models';
import {
    getEntityTypeOptionsWithExclusions,
    getFolderConfigurableEntityTypeOptions,
} from '../components/entities/actions';
import { getDataTypeFolderDataCount, getFolderDataTypeDataCount } from '../components/folder/actions';

import {
    clearSelected,
    ClearSelectedOptions,
    deleteView,
    getGridViews,
    GetSelectedResponse,
    getSnapshotSelections,
    incrementClientSideMetricCount,
    renameGridView,
    replaceSelected,
    ReplaceSelectedOptions,
    saveGridView,
    saveSessionView,
    SelectResponse,
    setSelected,
    setSnapshotSelections,
} from '../actions';

import { SchemaQuery } from '../../public/SchemaQuery';

import { ViewInfo } from '../ViewInfo';

import { QueryColumn } from '../../public/QueryColumn';

import { incrementRowCountMetric } from '../components/editable/utils';

import { QueryModel } from '../../public/QueryModel/QueryModel';

import { createOrderedSnapshotSelectionKey, createSnapshotSelectionKey } from '../../public/QueryModel/utils';

import {
    deleteRows,
    deleteRowsByContainer,
    DeleteRowsOptions,
    getDefaultVisibleColumns,
    getQueryDetails,
    GetQueryDetailsOptions,
    getServerDate,
    insertRows,
    InsertRowsOptions,
    QueryCommandResponse,
    saveRows,
    saveRowsByContainer,
    SaveRowsOptions,
    SelectDistinctOptions,
    selectDistinctRows,
    updateRows,
    updateRowsByContainer,
    UpdateRowsOptions,
} from './api';
import { executeSql, ExecuteSqlOptions, ExecuteSqlResponse } from './executeSql';
import { selectRows, SelectRowsOptions, SelectRowsResponse } from './selectRows';
import { EDIT_METHOD } from '../constants';

export interface QueryAPIWrapper {
    clearSelected: (options: ClearSelectedOptions) => Promise<SelectResponse>;
    createOrderedSnapshotSelectionKey: (model: QueryModel) => Promise<string>;
    createSnapshotSelectionKey: (model: QueryModel) => Promise<string>;
    deleteRows: (options: DeleteRowsOptions) => Promise<QueryCommandResponse>;
    deleteRowsByContainer: (options: DeleteRowsOptions, containerField: string) => Promise<QueryCommandResponse>;
    deleteView: (schemaQuery: SchemaQuery, containerPath: string, viewName?: string, revert?: boolean) => Promise<void>;
    executeSql: <T extends ExecuteSqlOptions>(options: T) => Promise<ExecuteSqlResponse<T>>;
    getDataTypeFolderDataCount: (
        entityDataType: EntityDataType,
        dataTypeRowId: number,
        dataTypeName: string
    ) => Promise<Record<string, number>>;
    getDefaultVisibleColumns: (options: GetQueryDetailsOptions) => Promise<QueryColumn[]>;
    getEntityTypeOptions: (
        entityDataType: EntityDataType,
        dataTypeExclusions?: Record<string, number[]>,
        containerPath?: string
    ) => Promise<Map<string, List<IEntityTypeOption>>>;
    getFolderConfigurableEntityTypeOptions: (
        entityDataType: EntityDataType,
        containerPath?: string,
        containerFilter?: Query.ContainerFilter
    ) => Promise<DataTypeEntity[]>;
    getFolderDataTypeDataCount: (
        dataType: FolderConfigurableDataType,
        containerPath?: string,
        allDataTypes?: DataTypeEntity[],
        isNewFolder?: boolean
    ) => Promise<Record<string, number>>;
    getGridViews: (
        schemaQuery: SchemaQuery,
        sort?: boolean,
        viewName?: string,
        excludeSessionView?: boolean,
        includeHidden?: boolean
    ) => Promise<ViewInfo[]>;
    getQueryDetails: (options: GetQueryDetailsOptions) => Promise<QueryInfo>;
    getServerDate: () => Promise<Date>;
    getSnapshotSelections: (key: string, containerPath?: string) => Promise<GetSelectedResponse>; // deprecated
    incrementClientSideMetricCount: (featureArea: string, metricName: string) => void;
    incrementRowCountMetric: (featureArea: string, rowCount: number, isUpdate: boolean) => void;
    insertRows: (options: InsertRowsOptions) => Promise<QueryCommandResponse>;
    renameGridView: (
        schemaQuery: SchemaQuery,
        containerPath: string,
        viewName: string,
        newName: string
    ) => Promise<void>;
    replaceSelected: (options: ReplaceSelectedOptions) => Promise<SelectResponse>;
    saveGridView: (
        schemaQuery: SchemaQuery,
        containerPath: string,
        viewInfo: ViewInfo,
        replace: boolean,
        session: boolean,
        inherit: boolean,
        shared: boolean,
        hidden?: boolean
    ) => Promise<void>;
    saveRows: (options: SaveRowsOptions) => Promise<Query.SaveRowsResponse>;
    saveRowsByContainer: (options: SaveRowsOptions, containerField?: string) => Promise<Query.SaveRowsResponse>;
    saveSessionView: (
        schemaQuery: SchemaQuery,
        containerPath: string,
        viewName: string,
        newName: string,
        inherit?: boolean,
        shared?: boolean,
        replace?: boolean
    ) => Promise<void>;
    selectDistinctRows: (selectDistinctOptions: SelectDistinctOptions) => Promise<Query.SelectDistinctResponse>;
    selectRows: (options: SelectRowsOptions) => Promise<SelectRowsResponse>;
    setSelected: (
        key: string,
        checked: boolean,
        ids: string | string[],
        containerPath?: string,
        validateIds?: boolean,
        schemaName?: string,
        queryName?: string,
        filters?: Filter.IFilter[],
        queryParameters?: Record<string, any>
    ) => Promise<SelectResponse>;
    setSnapshotSelections: (
        key: string,
        ids: number[] | string | string[],
        containerPath?: string
    ) => Promise<SelectResponse>; // deprecated
    updateRows: (options: UpdateRowsOptions) => Promise<QueryCommandResponse>;
    updateRowsByContainer: (
        schemaQuery: SchemaQuery,
        rows: any[],
        containerPaths: string[],
        auditUserComment: string,
        editMethod?: EDIT_METHOD,
        containerField?: string
    ) => Promise<Query.SaveRowsResponse | QueryCommandResponse>;
}

export class QueryServerAPIWrapper implements QueryAPIWrapper {
    clearSelected = clearSelected;
    createOrderedSnapshotSelectionKey = createOrderedSnapshotSelectionKey;
    createSnapshotSelectionKey = createSnapshotSelectionKey;
    deleteRows = deleteRows;
    deleteRowsByContainer = deleteRowsByContainer;
    deleteView = deleteView;
    executeSql = executeSql;
    getDataTypeFolderDataCount = getDataTypeFolderDataCount;
    getEntityTypeOptions = getEntityTypeOptionsWithExclusions;
    getGridViews = getGridViews;
    getFolderConfigurableEntityTypeOptions = getFolderConfigurableEntityTypeOptions;
    getFolderDataTypeDataCount = getFolderDataTypeDataCount;
    getQueryDetails = getQueryDetails;
    getSnapshotSelections = getSnapshotSelections; // deprecated
    getServerDate = getServerDate;
    incrementClientSideMetricCount = incrementClientSideMetricCount;
    incrementRowCountMetric = incrementRowCountMetric;
    insertRows = insertRows;
    saveRows = saveRows;
    renameGridView = renameGridView;
    replaceSelected = replaceSelected;
    saveGridView = saveGridView;
    saveRowsByContainer = saveRowsByContainer;
    saveSessionView = saveSessionView;
    selectRows = selectRows;
    selectDistinctRows = selectDistinctRows;
    setSelected = setSelected;
    setSnapshotSelections = setSnapshotSelections; // deprecated
    updateRows = updateRows;
    updateRowsByContainer = updateRowsByContainer;
    getDefaultVisibleColumns = getDefaultVisibleColumns;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getQueryTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<QueryAPIWrapper> = {}
): QueryAPIWrapper {
    return {
        clearSelected: mockFn(),
        createOrderedSnapshotSelectionKey: mockFn(),
        createSnapshotSelectionKey: mockFn(),
        deleteRows: mockFn(),
        deleteRowsByContainer: mockFn(),
        deleteView: mockFn(),
        executeSql: mockFn(),
        getDataTypeFolderDataCount: mockFn(),
        getEntityTypeOptions: mockFn(),
        getGridViews: mockFn(),
        getFolderConfigurableEntityTypeOptions: mockFn(),
        getFolderDataTypeDataCount: mockFn(),
        getQueryDetails: mockFn(),
        getSnapshotSelections: mockFn(),
        getServerDate: () => Promise.resolve(new Date()),
        incrementClientSideMetricCount: mockFn(),
        incrementRowCountMetric: mockFn(),
        insertRows: mockFn(),
        renameGridView: mockFn(),
        replaceSelected: mockFn(),
        saveGridView: mockFn(),
        saveRows: mockFn(),
        saveRowsByContainer: mockFn(),
        saveSessionView: mockFn(),
        selectRows: mockFn(),
        selectDistinctRows: mockFn(),
        setSelected: mockFn(),
        setSnapshotSelections: mockFn(),
        updateRows: mockFn(),
        updateRowsByContainer: mockFn(),
        getDefaultVisibleColumns: mockFn(),
        ...overrides,
    };
}
