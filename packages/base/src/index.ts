/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { GRID_CHECKBOX_OPTIONS, GRID_EDIT_INDEX, GRID_SELECTION_INDEX, PermissionTypes } from './models/constants'
import { fetchProtocol } from './action/actions'
import {
    AssayProtocolModel,
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
    ViewInfo
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
    toLowerSafe
} from './utils/utils'
import { buildURL, getSortFromUrl, hasParameter, imageURL, setParameter, toggleParameter } from './url/ActionURL'
import { AddEntityButton } from "./components/AddEntityButton"
import { RemoveEntityButton } from "./components/RemoveEntityButton"
import { AppURL, spliceURL } from "./url/AppURL";
import { Alert } from './components/Alert'
import { MultiMenuButton } from './components/menus/MultiMenuButton'
import { MenuOption, SubMenu } from "./components/menus/SubMenu";
import { SubMenuItem } from "./components/menus/SubMenuItem";
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
import { FileAttachmentForm } from './components/FileAttachmentForm'
import { Notification } from './components/notifications/Notification'
import { createNotification } from './components/notifications/actions'
import { initNotificationsState } from './components/notifications/global'
import { datePlaceholder } from './utils/Date';
import {
    MessageFunction,
    NotificationItemModel,
    NotificationItemProps,
    Persistence,
} from './components/notifications/model'
import { PermissionAllowed, PermissionNotAllowed, } from "./components/Permissions"
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
    FormSection,
    FileAttachmentForm,

    // actions
    fetchProtocol,

    // notification functions
    createNotification,
    initNotificationsState,

    // date functions
    datePlaceholder,

    // util functions
    caseInsensitive,
    capitalizeFirstChar,
    decodePart,
    encodePart,
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
