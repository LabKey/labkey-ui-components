/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Set } from 'immutable';
import { getServerContext } from '@labkey/api';

// We are currently accessing these vis and WebSocket namespaces off of the global context,
// but hopefully these can become their own packages or part of this package directly
export const LABKEY_VIS = getServerContext().vis;
export const LABKEY_WEBSOCKET = getServerContext().WebSocket;
export const LABKEY_PASSWORD_GAUGE = getServerContext().PasswordGauge;

export const QUERY_GRID_PREFIX = 'labkey-querygrid-';
export const FASTA_EXPORT_CONTROLLER = 'biologics';
export const GENBANK_EXPORT_CONTROLLER = 'biologics';
export const BARTENDER_EXPORT_CONTROLLER = 'sampleManager';
export const SAMPLE_SET_DISPLAY_TEXT = 'Sample Type';
export const STORAGE_MAP_EXPORT_CONTROLLER = 'inventory';

export const MAX_SELECTION_ACTION_ROWS = 1000;
export const MAX_EDITABLE_GRID_ROWS = MAX_SELECTION_ACTION_ROWS;
export const LOOKUP_DEFAULT_SIZE = 25;

export enum AssayUploadTabs {
    Grid = 1,
    Files = 2,
}

export enum EXPORT_TYPES {
    CSV,
    EXCEL,
    TSV,
    FASTA,
    GENBANK,
    LABEL,
    STORAGE_MAP,
    LABEL_TEMPLATE,
}

export enum EDIT_METHOD {
    BULK_EDIT = 'BulkEdit',
    BULK_EDIT_LINEAGE = 'BulkEditLineage',
    DETAIL_EDIT = 'DetailEdit',
    DETAIL_EDIT_LINEAGE = 'DetailEditLineage',
    FORM_INSERT = 'FormInsert',
    GRID_EDIT = 'GridEdit',
    GRID_INSERT = 'GridInsert',
    STORAGE_VIEW_ACTION = 'StorageViewAction',
}

export enum KEYS {
    A = 65,
    Add = 107,
    Alt = 18,
    Seven = 55,
    Ampersand = Seven,
    Eight = 56,
    Star = Eight,
    Asterik = Star,
    Two = 50,
    AtSign = Two,
    B = 66,
    Backspace = 8,
    C = 67,
    CapsLock = 20,

    Six = 54,
    Caret = Six,
    ClosedBracket = 221,
    Zero = 48,

    ClosedParen = Zero,
    Comma = 188,

    Ctrl = 17,
    D = 68,
    Dash = 189,
    DecimalPoint = 110,
    Delete = 46,
    Divide = 111,
    Four = 52,
    DollarSign = Four,
    DownArrow = 40,
    E = 69,
    End = 35,
    Enter = 13,
    Equals = 187,
    Escape = 27,
    One = 49,
    ExclamationMark = One,
    F = 70,
    F1 = 112,
    F2 = 113,
    F3 = 114,
    F4 = 115,
    F5 = 116,
    F6 = 117,

    F7 = 118,
    F8 = 119,
    F9 = 120,
    F10 = 121,
    F11 = 122,
    F12 = 123,
    FFLeftMetaKey = 224, // Firefox
    Five = 53,
    ForwardSlash = 191,
    G = 71,
    Tilde = 192,
    GraveAccent = Tilde,
    H = 72,
    Three = 51,
    PoundSign = Three,
    Hash = PoundSign,
    Hat = Caret,
    Home = 36,
    I = 73,
    Insert = 45,
    J = 74,
    K = 75,
    L = 76,
    LeftArrow = 37,
    LeftMetaKey = 91,
    M = 77,

    Multiply = 106,
    N = 78,
    Nine = 57,

    NumLock = 144,
    Numpad0 = 96,
    Numpad1 = 97,
    Numpad2 = 98,
    Numpad3 = 99,
    Numpad4 = 100,
    Numpad5 = 101,
    Numpad6 = 102,
    Numpad7 = 103,
    Numpad8 = 104,

    Numpad9 = 105,
    O = 79,
    OpenBracket = 219,
    OpenParen = Nine,
    P = 80,

    PageDown = 34,
    PageUp = 33,
    PauseBreak = 19,
    PercentSign = Five,
    Period = 190,
    PlusSign = Equals,
    Q = 81,
    Quote = 222,
    R = 82,
    RightArrow = 39,
    RightMetaKey = 92,
    S = 83,

    ScrollLock = 145,
    SelectKey = 93,

    SemiColon = 186,
    Shift = 16,
    Space = 32,
    Subtract = 109,
    T = 84,
    Tab = 9,
    U = 85,
    UnderScore = Dash,
    UpArrow = 38,
    V = 86,

    W = 87,
    X = 88,
    Y = 89,

    Z = 90,
}

// This is used for filtering search results.  Since we first check for search hits containing
// a data object, which exp.data objects and materials have, the most important elements of this
// array are the types that don't have that data object.
export const RELEVANT_SEARCH_RESULT_TYPES = ['data', 'experiment', 'material', 'materialSource', 'assay'];

export const SAMPLE_UNIQUE_FIELD_KEY = 'Name';
export const DATA_CLASS_UNIQUE_FIELD_KEY = 'Name';

export const NO_UPDATES_MESSAGE = 'No changes were made because the provided values match the existing values.';
export const PARENT_ALIAS_HELPER_TEXT =
    "Column headings used during import to set a sample's parentage. " +
    'The referenced type will also be added as a parent type by default when adding samples manually.';

export enum DataViewInfoTypes {
    AutomaticPlot = 'Automatic Plot',
    BarChart = 'Bar Chart',
    BoxAndWhiskerPlot = 'Box and Whisker Plot',
    CrosstabReport = 'Crosstab Report',
    Dataset = 'Dataset',
    ParticipantReport = 'Participant Report',
    PieChart = 'Pie Chart',
    Query = 'Query',
    RReport = 'R Report',
    SampleFinderSavedSearch = 'Sample Finder Saved Search',
    TimeChart = 'Time Chart',
    XYScatterPlot = 'XY Scatter Plot',
    XYSeriesLinePlot = 'XY Series Line Plot',
}

export const GRID_REPORTS = Set([DataViewInfoTypes.Query, DataViewInfoTypes.Dataset]);
export const GENERIC_CHART_REPORTS = [
    DataViewInfoTypes.AutomaticPlot,
    DataViewInfoTypes.BarChart,
    DataViewInfoTypes.BoxAndWhiskerPlot,
    DataViewInfoTypes.PieChart,
    DataViewInfoTypes.XYScatterPlot,
    DataViewInfoTypes.XYSeriesLinePlot,
];
export const VISUALIZATION_REPORTS = Set([...GENERIC_CHART_REPORTS, DataViewInfoTypes.RReport]);

export enum IMPORT_DATA_FORM_TYPES {
    GRID = 1, // This designates the starting point for the enum. By default it starts at 0, but since that is falsy, it makes the check "if (inputFormType)" problematic.
    TEXT,
    FILE,
    OTHER,
}

export const GRID_EDIT_INDEX = '__editing__';
export const GRID_SELECTION_INDEX = '__selection__';
export const GRID_NAME_INDEX = '__name__';
export const GRID_HEADER_CELL_BODY = 'grid-header-cell__body';

export enum GRID_CHECKBOX_OPTIONS {
    ALL,
    SOME,
    NONE,
}

export const PIPELINE_JOB_NOTIFICATION_EVENT =
    'org.labkey.api.pipeline.AppPipelineJobNotificationProvider.ImportNotify';
export const PIPELINE_JOB_NOTIFICATION_EVENT_START = PIPELINE_JOB_NOTIFICATION_EVENT + '#Start';
export const PIPELINE_JOB_NOTIFICATION_EVENT_SUCCESS = PIPELINE_JOB_NOTIFICATION_EVENT + '#Success';
export const PIPELINE_JOB_NOTIFICATION_EVENT_ERROR = PIPELINE_JOB_NOTIFICATION_EVENT + '#Error';

export const SHARED_CONTAINER_PATH = '/Shared';

export const VIEW_NOT_FOUND_EXCEPTION_CLASS = 'org.labkey.api.view.NotFoundException';
export const APP_FIELD_CANNOT_BE_REMOVED_MESSAGE = 'This application field cannot be removed.';

export const CELL_SELECTION_HANDLE_CLASSNAME = 'cell-selection-handle';

export const EMPTY_NS_SEQUENCE_WARNING =
    'Without a sequence, Protein sequence translations cannot be done automatically, and the system cannot prevent duplicates.';
export const EMPTY_PS_SEQUENCE_WARNING =
    'No sequence added. The structure format and physical properties of molecules using this sequence cannot be calculated.';
export const EMPTY_COMPOUND_WARNING =
    'Without SMILES, Molecule component translation cannot be done automatically, and the system cannot prevent duplicates.';
export const UNIDENTIFIED_MOLECULE_WARNING =
    'Components not added or are unidentified. The structure format and physical properties cannot be calculated.';
