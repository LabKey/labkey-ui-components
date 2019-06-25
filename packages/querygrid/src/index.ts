/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { EditorModel, SearchResultsModel, getStateQueryGridModel } from './models'
import {
    getSelected,
    gridIdInvalidate,
    gridInit,
    gridInvalidate,
    gridRefresh,
    gridShowError,
    queryGridInvalidate,
    schemaGridInvalidate,
    addColumns,
    changeColumn,
    removeColumn,
    searchUsingIndex
} from './actions'
import {
    getEditorModel,
    getQueryGridModel,
    initQueryGridState,
    removeQueryGridModel,
    setQueryColumnRenderers,
    setQueryMetadata
} from './global'
import {
    getQueryDetails,
    invalidateQueryDetailsCacheKey,
    InsertRowsResponse,
    ISelectRowsResult,
    IImportData,
    InsertFormats,
    InsertOptions,
    insertRows,
    searchRows,
    selectRows,
    updateRows,
    deleteRows,
    importData
} from './query/api'
import { getLocation, Location, pushParameter, pushParameters, replaceParameters } from './util/URL'
import { URLResolver } from './util/URLResolver'
import { URLService } from './util/URLService'
import { AssayResolver, AssayRunResolver, ListResolver, SampleSetResolver, SamplesResolver } from './util/AppURLResolver'
import { QueryGridPanel } from './components/QueryGridPanel'
import { EditableGridPanel } from './components/editable/EditableGridPanel'
import { EditableColumnMetadata } from "./components/editable/EditableGrid";
import { AliasRenderer } from './renderers/AliasRenderer'
import { AppendUnits } from './renderers/AppendUnits'
import { DefaultRenderer } from './renderers/DefaultRenderer'
import { FileColumnRenderer } from './renderers/FileColumnRenderer'
import { MultiValueRenderer } from './renderers/MultiValueRenderer'
import { QueryInfoForm } from './components/forms/QueryInfoForm'
import { LabelOverlay } from './components/forms/LabelOverlay'
import { SelectInput } from './components/forms/input/SelectInput'
import { QuerySelect } from './components/forms/QuerySelect'
import { PageDetailHeader } from './components/forms/PageDetailHeader'
import { DetailEditing } from './components/forms/detail/DetailEditing'
import { resolveDetailRenderer } from './components/forms/detail/DetailEditRenderer'
import { Detail } from './components/forms/detail/Detail'
import { PlacementType } from './components/editable/Controls'
import { SchemaListing } from './components/listing/SchemaListing'
import { QueriesListing } from './components/listing/QueriesListing'
import { ReactSelectOption } from './components/forms/model'
import { HeatMap } from './components/heatmap/HeatMap'
import { SampleInsertPanel } from './components/samples/SampleInsertPanel'
import { SampleDeleteConfirmModal } from './components/samples/SampleDeleteConfirmModal'
import { SearchResultCard } from './components/search/SearchResultCard'
import { SearchResultsPanel } from './components/search/SearchResultsPanel'
import { createSampleSet, deleteSampleSet } from './components/samples/actions'
import { SampleSetDeleteConfirmModal } from './components/samples/SampleSetDeleteConfirmModal'
import { SampleSetDetailsPanel } from './components/samples/SampleSetDetailsPanel'

export {
    // global state functions
    initQueryGridState,
    getStateQueryGridModel,
    getQueryGridModel,
    getEditorModel,
    removeQueryGridModel,
    setQueryMetadata,
    setQueryColumnRenderers,

    // grid functions
    getSelected,
    gridInit,
    gridInvalidate,
    gridIdInvalidate,
    queryGridInvalidate,
    schemaGridInvalidate,
    gridRefresh,
    gridShowError,

    // query related items
    ISelectRowsResult,
    InsertRowsResponse,
    IImportData,
    InsertFormats,
    InsertOptions,
    insertRows,
    selectRows,
    searchRows,
    updateRows,
    deleteRows,
    importData,
    getQueryDetails,
    invalidateQueryDetailsCacheKey,

    // editable grid related items
    addColumns,
    changeColumn,
    removeColumn,

    // location related items
    Location,
    URLResolver,
    URLService,
    AssayResolver,
    AssayRunResolver,
    ListResolver,
    SamplesResolver,
    SampleSetResolver,
    getLocation,
    pushParameter,
    pushParameters,
    replaceParameters,

    // renderers
    AliasRenderer,
    AppendUnits,
    DefaultRenderer,
    FileColumnRenderer,
    MultiValueRenderer,
    resolveDetailRenderer,

    // components
    LabelOverlay,
    EditableGridPanel,
    QueryGridPanel,
    QueryInfoForm,
    SelectInput,
    QuerySelect,
    PageDetailHeader,
    DetailEditing,
    Detail,
    SchemaListing,
    QueriesListing,
    HeatMap,

    // interfaces
    EditableColumnMetadata,

    // types
    PlacementType,
    ReactSelectOption,
    EditorModel,

    // samples-related
    SampleInsertPanel,
    SampleDeleteConfirmModal,
    SampleSetDetailsPanel,
    SampleSetDeleteConfirmModal,
    createSampleSet,
    deleteSampleSet,

    // search-related
    SearchResultsModel,
    SearchResultCard,
    SearchResultsPanel,
    searchUsingIndex
}