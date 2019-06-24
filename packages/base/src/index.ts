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
import { GRID_CHECKBOX_OPTIONS, GRID_EDIT_INDEX, GRID_SELECTION_INDEX, PermissionTypes } from './models/constants'
import { SCHEMAS, fetchSchemas, fetchGetQueries } from './models/schemas'
import { fetchProtocol, fetchAllAssays, createGeneralAssayDesign, importGeneralAssayRun, inferDomainFromFile } from './action/actions'
import {
    AssayProtocolModel,
    AssayDefinitionModel,
    Container,
    IGridLoader,
    IGridResponse,
    IGridSelectionResponse,
    insertColumnFilter,
    IQueryGridModel,
    LastActionStatus,
    MessageLevel,
    QueryColumn,
    QueryGridModel,
    QueryInfo,
    QueryInfoStatus,
    QueryLookup,
    QuerySort,
    SchemaDetails,
    SchemaQuery,
    User,
    ViewInfo,
    InferDomainResponse
} from './models/model'
import {
    applyDevTools,
    capitalizeFirstChar,
    caseInsensitive,
    debounce,
    decodePart,
    devToolsActive,
    encodePart,
    generateId,
    getCommonDataValues,
    getSchemaQuery,
    hasAllPermissions,
    intersect,
    naturalSort,
    not,
    resolveKey,
    resolveKeyFromJson,
    resolveSchemaQuery,
    similaritySortFactory,
    toggleDevTools,
    toLowerSafe,
    unorderedEqual,
    valueIsEmpty
} from './utils/utils'
import { buildURL, getSortFromUrl, hasParameter, imageURL, setParameter, toggleParameter } from './url/ActionURL'
import { AddEntityButton } from "./components/buttons/AddEntityButton"
import { RemoveEntityButton } from "./components/buttons/RemoveEntityButton"
import { AppURL, spliceURL } from "./url/AppURL";
import { Alert } from './components/Alert'
import { MultiMenuButton } from './components/menus/MultiMenuButton'
import { MenuOption, SubMenu } from "./components/menus/SubMenu";
import { SubMenuItem } from "./components/menus/SubMenuItem";
import { SelectionMenuItem } from "./components/menus/SelectionMenuItem";
import { CustomToggle } from './components/CustomToggle'
import { LoadingSpinner } from './components/LoadingSpinner'
import { NotFound } from './components/NotFound'
import { Page, PageProps } from './components/Page'
import { LoadingPage, LoadingPageProps } from './components/LoadingPage'
import { PageHeader } from './components/PageHeader'
import { Progress } from './components/Progress'
import { Tip } from './components/Tip'
import { Grid, GridColumn, GridData, GridProps } from './components/Grid'
import { FormSection } from './components/FormSection'
import { Section } from './components/Section'
import { FileAttachmentForm } from './components/files/FileAttachmentForm'
import { Notification } from './components/notifications/Notification'
import { createNotification } from './components/notifications/actions'
import { dismissNotifications } from './components/notifications/global'
import { initNotificationsState } from './components/notifications/global'
import { ConfirmModal } from './components/ConfirmModal'
import { datePlaceholder, getUnFormattedNumber } from './utils/Date';
import { Theme, SVGIcon } from './components/SVGIcon';
import { CreatedModified } from './components/CreatedModified';
import {
    MessageFunction,
    NotificationItemModel,
    NotificationItemProps,
    Persistence,
} from './components/notifications/model'
import {
    PermissionAllowed,
    PermissionNotAllowed,
} from "./components/Permissions"
import { PaginationButtons, PaginationButtonsProps } from './components/buttons/PaginationButtons';
import { ManageDropdownButton } from './components/buttons/ManageDropdownButton';
import { WizardNavButtons } from './components/buttons/WizardNavButtons';
import { ToggleButtons } from './components/buttons/ToggleButtons';
import { Cards } from './components/Cards';

// Import the scss file so it will be processed in the rollup scripts
import './theme/index.scss'

// export * from './typings/react-bootstrap.d.ts'

// Add explicit export block for the classes and functions to be exported from this package
export {
    // constants
    GRID_EDIT_INDEX,
    GRID_SELECTION_INDEX,
    GRID_CHECKBOX_OPTIONS,
    PermissionTypes,
    Persistence,
    SCHEMAS,

    // interfaces
    IQueryGridModel,
    IGridLoader,
    IGridResponse,
    IGridSelectionResponse,
    GridProps,
    LoadingPageProps,
    PageProps,

    //models
    AppURL,
    AssayProtocolModel,
    AssayDefinitionModel,
    Container,
    User,
    QueryColumn,
    QueryGridModel,
    QueryInfo,
    QuerySort,
    QueryLookup,
    QueryInfoStatus,
    SchemaDetails,
    SchemaQuery,
    ViewInfo,
    MessageLevel,
    MessageFunction,
    NotificationItemProps,
    NotificationItemModel,
    LastActionStatus,
    GridColumn,
    GridData,
    InferDomainResponse,

    //components
    AddEntityButton,
    RemoveEntityButton,
    Alert,
    CustomToggle,
    LoadingSpinner,
    LoadingPage,
    NotFound,
    Page,
    PageHeader,
    Progress,
    MenuOption,
    MultiMenuButton,
    Notification,
    SubMenu,
    SubMenuItem,
    Tip,
    Grid,
    PermissionAllowed,
    PermissionNotAllowed,
    PaginationButtons,
    PaginationButtonsProps,
    FormSection,
    Section,
    FileAttachmentForm,
    ConfirmModal,
    CreatedModified,
    SelectionMenuItem,
    ManageDropdownButton,
    WizardNavButtons,
    ToggleButtons,
    Cards,

    // actions
    fetchProtocol,
    fetchAllAssays,
    fetchSchemas,
    fetchGetQueries,
    createGeneralAssayDesign,
    importGeneralAssayRun,
    inferDomainFromFile,

    // notification functions
    createNotification,
    dismissNotifications,
    initNotificationsState,

    // date and format functions
    datePlaceholder,
    getUnFormattedNumber,

    // images
    Theme,
    SVGIcon,

    // util functions
    caseInsensitive,
    capitalizeFirstChar,
    decodePart,
    encodePart,
    getCommonDataValues,
    getSchemaQuery,
    resolveKey,
    resolveKeyFromJson,
    resolveSchemaQuery,
    insertColumnFilter,
    intersect,
    hasAllPermissions,
    naturalSort,
    not,
    toLowerSafe,
    generateId,
    debounce,
    similaritySortFactory,
    unorderedEqual,
    valueIsEmpty,

    // url functions
    buildURL,
    getSortFromUrl,
    hasParameter,
    imageURL,
    setParameter,
    toggleParameter,
    spliceURL,

    // devTools functions
    applyDevTools,
    devToolsActive,
    toggleDevTools

}
