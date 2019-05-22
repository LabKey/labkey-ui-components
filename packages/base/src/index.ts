/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { GRID_CHECKBOX_OPTIONS, GRID_EDIT_INDEX, GRID_SELECTION_INDEX, PermissionTypes } from './models/constants'
import {
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
    debounce,
    decodePart,
    devToolsActive,
    encodePart,
    generateId,
    getSchemaQuery,
    intersect,
    hasAllPermissions,
    naturalSort,
    not,
    resolveKey,
    resolveKeyFromJson,
    resolveSchemaQuery,
    toggleDevTools,
    toLowerSafe
} from './utils/utils'
import {
    AppURL,
    buildURL,
    getSortFromUrl,
    hasParameter,
    imageURL,
    setParameter,
    toggleParameter
} from './url/ActionURL'
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
import { PaginationButtons, PaginationButtonsProps } from './components/PaginationButtons';
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
    FileAttachmentForm,

    // notification functions
    createNotification,
    initNotificationsState,

    // util functions
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

    // url functions
    buildURL,
    getSortFromUrl,
    hasParameter,
    imageURL,
    setParameter,
    toggleParameter,

    // devTools functions
    applyDevTools,
    devToolsActive,
    toggleDevTools
}
