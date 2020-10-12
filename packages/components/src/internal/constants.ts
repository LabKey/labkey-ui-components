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
import { Set } from 'immutable';

export const QUERY_GRID_PREFIX = 'labkey-querygrid-';
export const FASTA_EXPORT_CONTROLLER = 'biologics';
export const GENBANK_EXPORT_CONTROLLER = 'biologics';
export const BARTENDER_EXPORT_CONTROLLER = "sampleManager";
export const SAMPLE_SET_DISPLAY_TEXT = 'Sample Type';

export const MAX_EDITABLE_GRID_ROWS = 1000;
export const LOOKUP_DEFAULT_SIZE = 25;

export enum EXPORT_TYPES {
    CSV,
    EXCEL,
    TSV,
    FASTA,
    GENBANK,
    LABEL
}

export enum MODIFICATION_TYPES {
    ADD,
    REPLACE,
    REMOVE,
    REMOVE_ALL,
}

export enum SELECTION_TYPES {
    ALL,
    AREA,
    SINGLE,
}

export enum KEYS {
    Backspace = 8,
    Tab = 9,
    Enter = 13,
    Shift = 16,
    Ctrl = 17,
    Alt = 18,
    PauseBreak = 19,
    CapsLock = 20,
    Escape = 27,
    Space = 32,
    PageUp = 33,
    PageDown = 34,
    End = 35,
    Home = 36,

    LeftArrow = 37,
    UpArrow = 38,
    RightArrow = 39,
    DownArrow = 40,

    Insert = 45,
    Delete = 46,

    Zero = 48,
    ClosedParen = Zero,
    One = 49,
    ExclamationMark = One,
    Two = 50,
    AtSign = Two,
    Three = 51,
    PoundSign = Three,
    Hash = PoundSign,
    Four = 52,
    DollarSign = Four,
    Five = 53,
    PercentSign = Five,
    Six = 54,
    Caret = Six,
    Hat = Caret,
    Seven = 55,
    Ampersand = Seven,
    Eight = 56,
    Star = Eight,
    Asterik = Star,
    Nine = 57,
    OpenParen = Nine,

    A = 65,
    B = 66,
    C = 67,
    D = 68,
    E = 69,
    F = 70,
    G = 71,
    H = 72,
    I = 73,
    J = 74,
    K = 75,
    L = 76,
    M = 77,
    N = 78,
    O = 79,
    P = 80,
    Q = 81,
    R = 82,
    S = 83,
    T = 84,
    U = 85,
    V = 86,
    W = 87,
    X = 88,
    Y = 89,
    Z = 90,

    LeftMetaKey = 91,
    RightMetaKey = 92,
    SelectKey = 93,

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

    Multiply = 106,
    Add = 107,
    Subtract = 109,
    DecimalPoint = 110,
    Divide = 111,

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

    NumLock = 144,
    ScrollLock = 145,

    SemiColon = 186,
    Equals = 187,
    Comma = 188,
    Dash = 189,
    Period = 190,
    UnderScore = Dash,
    PlusSign = Equals,
    ForwardSlash = 191,
    Tilde = 192,
    GraveAccent = Tilde,

    OpenBracket = 219,
    ClosedBracket = 221,
    Quote = 222,

    FFLeftMetaKey = 224, // Firefox
}

// This is used for filtering search results.  Since we first check for search hits containing
// a data object, which exp.data objects and materials have, the most important elements of this
// array are the types that don't have that data object.
export const RELEVANT_SEARCH_RESULT_TYPES = ['data', 'experiment', 'material', 'materialSource', 'assay'];

export const SAMPLE_UNIQUE_FIELD_KEY = 'Name';
export const DATA_CLASS_UNIQUE_FIELD_KEY = 'Name';

export const NO_UPDATES_MESSAGE = 'No changes were made because the provided values match the existing values.';
export const PARENT_ALIAS_HELPER_TEXT = "Column headings used during import to set a sample's parentage.";

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
    SampleComparison = 'Sample Comparison',
    TimeChart = 'Time Chart',
    XYScatterPlot = 'XY Scatter Plot',
    XYSeriesLinePlot = 'XY Series Line Plot',
}

export const GRID_REPORTS = Set([DataViewInfoTypes.Query, DataViewInfoTypes.Dataset]);
export const VISUALIZATION_REPORTS = Set([
    DataViewInfoTypes.AutomaticPlot,
    DataViewInfoTypes.BarChart,
    DataViewInfoTypes.BoxAndWhiskerPlot,
    DataViewInfoTypes.PieChart,
    DataViewInfoTypes.XYScatterPlot,
    DataViewInfoTypes.XYSeriesLinePlot,
]);

export enum IMPORT_DATA_FORM_TYPES {
    GRID = 1, // This designates the starting point for the enum. By default it starts at 0, but since that is falsy, it makes the check "if (inputFormType)" problematic.
    TEXT,
    FILE,
    OTHER,
}

