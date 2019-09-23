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
import { EditorModel, getStateQueryGridModel, SearchResultsModel } from './models';
import {
    addColumns,
    changeColumn,
    createQueryGridModelFilteredBySample,
    getSelected,
    getSelectedData,
    getSelection,
    gridIdInvalidate,
    gridInit,
    gridInvalidate,
    gridRefresh,
    gridShowError,
    queryGridInvalidate,
    removeColumn,
    schemaGridInvalidate,
    searchUsingIndex,
    setSelected
} from './actions';
import {
    getEditorModel,
    getQueryGridModel,
    initQueryGridState,
    removeQueryGridModel,
    setQueryColumnRenderers,
    setQueryMetadata
} from './global';
import {
    deleteRows,
    getQueryDetails,
    IImportData,
    importData,
    InsertFormats,
    InsertOptions,
    insertRows,
    InsertRowsResponse,
    invalidateQueryDetailsCacheKey,
    ISelectRowsResult,
    searchRows,
    selectRows,
    updateRows
} from './query/api';
import { MAX_EDITABLE_GRID_ROWS, NO_UPDATES_MESSAGE } from './constants';
import { getLocation, Location, pushParameter, pushParameters, replaceParameters } from './util/URL';
import { URLResolver } from './util/URLResolver';
import { URLService } from './util/URLService';
import {
    AppRouteResolver,
    AssayResolver,
    AssayRunResolver,
    ListResolver,
    SampleSetResolver,
    SamplesResolver
} from './util/AppURLResolver';
import { QueryGridPanel } from './components/QueryGridPanel';
import { EditableGridPanel } from './components/editable/EditableGridPanel';
import { EditableColumnMetadata } from './components/editable/EditableGrid';
import { AliasRenderer } from './renderers/AliasRenderer';
import { AppendUnits } from './renderers/AppendUnits';
import { DefaultRenderer } from './renderers/DefaultRenderer';
import { FileColumnRenderer } from './renderers/FileColumnRenderer';
import { MultiValueRenderer } from './renderers/MultiValueRenderer';
import { QueryInfoForm } from './components/forms/QueryInfoForm';
import { LabelOverlay } from './components/forms/LabelOverlay';
import { SelectInput } from './components/forms/input/SelectInput';
import { QuerySelect } from './components/forms/QuerySelect';
import { PageDetailHeader } from './components/forms/PageDetailHeader';
import { DetailEditing } from './components/forms/detail/DetailEditing';
import { resolveDetailRenderer } from './components/forms/detail/DetailEditRenderer';
import { Detail } from './components/forms/detail/Detail';
import { handleInputTab, handleTabKeyOnTextArea } from './components/forms/actions';
import { FormStep, FormTabs, withFormSteps, WithFormStepsProps } from './components/forms/FormStep';
import { PlacementType } from './components/editable/Controls';
import { SchemaListing } from './components/listing/SchemaListing';
import { QueriesListing } from './components/listing/QueriesListing';
import { HeatMap } from './components/heatmap/HeatMap';
import { SampleInsertPanel } from './components/samples/SampleInsertPanel';
import { SampleDeleteConfirmModal } from './components/samples/SampleDeleteConfirmModal';
import { SearchResultCard } from './components/search/SearchResultCard';
import { SearchResultsPanel } from './components/search/SearchResultsPanel';
import { deleteSampleSet, getSampleDeleteConfirmationData, getSampleSet, loadSelectedSamples } from './components/samples/actions';
import { SampleSetDeleteConfirmModal } from './components/samples/SampleSetDeleteConfirmModal';
import { SampleSetDetailsPanel } from './components/samples/SampleSetDetailsPanel';
import { AssayImportPanels } from './components/assay/AssayImportPanels';
import { BatchPropertiesPanel } from './components/assay/BatchPropertiesPanel';
import { RunPropertiesPanel } from './components/assay/RunPropertiesPanel';
import { RunDataPanel } from './components/assay/RunDataPanel';
import { AssayUploadGridLoader } from './components/assay/AssayUploadGridLoader';
import { AssayDesignDeleteConfirmModal } from './components/assay/AssayDesignDeleteConfirmModal';
import { AssayResultDeleteConfirmModal } from './components/assay/AssayResultDeleteConfirmModal';
import { AssayRunDeleteConfirmModal } from './components/assay/AssayRunDeleteConfirmModal';
import { AssayImportSubMenuItem } from './components/assay/AssayImportSubMenuItem';
import {
    AssayUploadResultModel,
    AssayWizardModel,
    IAssayUploadOptions,
    IAssayURLContext
} from './components/assay/models';
import {
    deleteAssayDesign,
    deleteAssayRuns,
    getBatchPropertiesModel,
    getBatchPropertiesRow,
    getImportItemsForAssayDefinitions,
    getRunPropertiesModel,
    getRunPropertiesRow,
    importAssayRun,
    uploadAssayRunFiles
} from './components/assay/actions';
import { PreviewGrid } from './components/PreviewGrid';
import {
    flattenBrowseDataTreeResponse,
    ReportURLMapper,
} from './components/report-list/model';
import { DataViewInfoTypes, IDataViewInfo} from './models';
import { ReportItemModal, ReportList, ReportListItem, ReportListProps } from './components/report-list/ReportList';

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
    getSelectedData,
    getSelection,
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
    getSampleDeleteConfirmationData,
    setSelected,

    // editable grid related items
    addColumns,
    changeColumn,
    removeColumn,
    MAX_EDITABLE_GRID_ROWS,
    NO_UPDATES_MESSAGE,

    // location related items
    Location,
    URLResolver,
    URLService,
    AppRouteResolver,
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
    PreviewGrid,
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
    EditorModel,

    // samples-related
    SampleInsertPanel,
    SampleDeleteConfirmModal,
    SampleSetDetailsPanel,
    SampleSetDeleteConfirmModal,
    deleteSampleSet,
    getSampleSet,
    createQueryGridModelFilteredBySample,
    loadSelectedSamples,

    // search-related
    SearchResultsModel,
    SearchResultCard,
    SearchResultsPanel,
    searchUsingIndex,

    // assay
    AssayUploadResultModel,
    AssayDesignDeleteConfirmModal,
    AssayResultDeleteConfirmModal,
    AssayRunDeleteConfirmModal,
    AssayWizardModel,
    IAssayURLContext,
    IAssayUploadOptions,
    AssayUploadGridLoader,
    AssayImportPanels,
    BatchPropertiesPanel,
    RunPropertiesPanel,
    RunDataPanel,
    AssayImportSubMenuItem,
    importAssayRun,
    uploadAssayRunFiles,
    deleteAssayDesign,
    deleteAssayRuns,
    getImportItemsForAssayDefinitions,
    getRunPropertiesModel,
    getRunPropertiesRow,
    getBatchPropertiesModel,
    getBatchPropertiesRow,

    // forms
    handleInputTab,
    handleTabKeyOnTextArea,
    withFormSteps,
    WithFormStepsProps,
    FormStep,
    FormTabs,

    // DataViewInfo
    DataViewInfoTypes,
    IDataViewInfo,

    // report-list
    flattenBrowseDataTreeResponse,
    ReportURLMapper,
    ReportListItem,
    ReportItemModal,
    ReportListProps,
    ReportList,
};
