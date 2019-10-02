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
import {List} from "immutable";
import {GridColumn} from "@glass/base";

export const DOMAIN_FIELD_PREFIX = 'domainpropertiesrow';
export const DOMAIN_FIELD_NAME = 'name';
export const DOMAIN_FIELD_TYPE = 'type';
export const DOMAIN_FIELD_ADV = 'adv';
export const DOMAIN_FIELD_EXPAND = 'expand';
export const DOMAIN_FIELD_DELETE = 'delete';
export const DOMAIN_FIELD_ROW = 'row';
export const DOMAIN_FIELD_REQUIRED = 'required';
export const DOMAIN_FIELD_DETAILS = 'details';
export const DOMAIN_FIELD_DESCRIPTION = 'description';
export const DOMAIN_FIELD_LABEL = 'label';
export const DOMAIN_FIELD_IMPORTALIASES = 'importAliases';
export const DOMAIN_FIELD_URL = 'URL';
export const DOMAIN_FIELD_LOOKUP_CONTAINER = 'lookupContainer';
export const DOMAIN_FIELD_LOOKUP_QUERY = 'lookupQueryValue';
export const DOMAIN_FIELD_LOOKUP_SCHEMA = 'lookupSchema';
export const DOMAIN_FIELD_FORMAT = 'format';
export const DOMAIN_FIELD_DEFAULT_SCALE = 'defaultScale';
export const DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING = 'excludeFromShifting';
export const DOMAIN_FIELD_MEASURE = 'measure';
export const DOMAIN_FIELD_DIMENSION = 'dimension';
export const DOMAIN_FIELD_HIDDEN = 'hidden';
export const DOMAIN_FIELD_MVENABLED = 'mvEnabled';
export const DOMAIN_FIELD_PHI = 'PHI';
export const DOMAIN_FIELD_RECOMMENDEDVARIABLE = 'recommendedVariable';
export const DOMAIN_FIELD_SHOWNINDETAILSVIEW = 'shownInDetailsView';
export const DOMAIN_FIELD_SHOWNININSERTVIEW = 'shownInInsertView';
export const DOMAIN_FIELD_SHOWNINUPDATESVIEW = 'shownInUpdateView';
export const DOMAIN_FIELD_CLIENT_SIDE_ERROR = 'error';

// TextFieldOptions
export const DOMAIN_FIELD_MAX_LENGTH = 'maxLength';
export const DOMAIN_FIELD_CUSTOM_LENGTH = 'customLength';
export const DOMAIN_FIELD_SCALE = 'scale';

export const DOMAIN_COND_FORMAT = 'conditionalFormat';
export const DOMAIN_REGEX_VALIDATOR = 'regexValidator';
export const DOMAIN_RANGE_VALIDATOR = 'rangeValidator';

export const DOMAIN_COND_FORMATS = 'conditionalFormats';
export const DOMAIN_REGEX_VALIDATORS = 'regexValidators';
export const DOMAIN_RANGE_VALIDATORS = 'rangeValidators';

export const DOMAIN_VALIDATOR_EXPRESSION = 'expression';
export const DOMAIN_VALIDATOR_DESCRIPTION = 'description';
export const DOMAIN_VALIDATOR_ERRORMESSAGE = 'errorMessage';
export const DOMAIN_VALIDATOR_FAILONMATCH = 'failOnMatch';
export const DOMAIN_VALIDATOR_NAME = 'name';
export const DOMAIN_VALIDATOR_REMOVE = 'removeValidator';

export const DOMAIN_VALIDATOR_BOLD = 'bold';
export const DOMAIN_VALIDATOR_ITALIC = 'italic';
export const DOMAIN_VALIDATOR_STRIKETHROUGH = 'strikethrough';

export const DOMAIN_CONDITIONAL_FORMAT_PREFIX = 'format.column';
export const DOMAIN_CONDITION_FORMAT_TEXT_COLOR = 'textColor';
export const DOMAIN_CONDITION_FORMAT_BACKGROUND_COLOR = 'backgroundColor';


export const DOMAIN_FIRST_FILTER_TYPE = 'firstFilterType';
export const DOMAIN_FIRST_FILTER_VALUE = 'firstFilterValue';
export const DOMAIN_SECOND_FILTER_TYPE = 'secondFilterType';
export const DOMAIN_SECOND_FILTER_VALUE = 'secondFilterValue';

export const DOMAIN_FIELD_NOT_LOCKED = "NotLocked"; // not locked, can change all properties
export const DOMAIN_FIELD_PARTIALLY_LOCKED = "PartiallyLocked"; // can't change name and type, for example, but can change other properties
export const DOMAIN_FIELD_FULLY_LOCKED = "FullyLocked"; // can't change any properties

export const SEVERITY_LEVEL_ERROR = "Error";
export const SEVERITY_LEVEL_WARN = "Warning";

// Default scale types
export const DEFAULT_SCALE_LINEAR = 'LINEAR';
export const DEFAULT_SCALE_LOG = 'LOG';

export const EXPAND_TRANSITION = 300;
export const EXPAND_TRANSITION_FAST = 0;

// URIs for data types
export const STRING_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#string';
export const MULTILINE_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#multiLine';
export const BOOLEAN_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#boolean';
export const INT_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#int';
export const DOUBLE_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#double';
export const DATETIME_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#dateTime';
export const FILELINK_RANGE_URI = 'http://cpas.fhcrc.org/exp/xml#fileLink';
export const ATTACHMENT_RANGE_URI = 'http://www.labkey.org/exp/xml#attachment';
export const USER_RANGE_URI = 'http://www.labkey.org/exp/xml#int';

export const FLAG_CONCEPT_URI = 'http://www.labkey.org/exp/xml#flag';
export const PARTICIPANTID_CONCEPT_URI = 'http://cpas.labkey.com/Study#ParticipantId';

export const MAX_TEXT_LENGTH = 4000;

export const HIGHLIGHT_BLUE = '#2980B9';  // See $blue-border in variables.scss
export const NOT_HIGHLIGHT_GRAY = '#999999';
// export const HIGHLIGHT_BLUE = '#3495D2';

export const LK_URL_ENCODING_DOC = "https://www.labkey.org/Documentation/wiki-page.view?name=urlEncoding";
export const LK_DOMAIN_HELP_URL = "https://www.labkey.org/Documentation/wiki-page.view?name=propertyFields";

export const PHILEVEL_NOT_PHI = "NotPHI";
export const PHILEVEL_LIMITED_PHI = "Limited";
export const PHILEVEL_FULL_PHI = "PHI";
export const PHILEVEL_RESTRICTED_PHI = "Restricted";

export const DOMAIN_PHI_LEVELS = List([
    {label: 'Not PHI', value: PHILEVEL_NOT_PHI},
    {label: 'Limited PHI', value: PHILEVEL_LIMITED_PHI},
    {label: 'Full PHI', value: PHILEVEL_FULL_PHI},
    {label: 'Restricted PHI', value: PHILEVEL_RESTRICTED_PHI}
]);

export const DOMAIN_FIELD_COLS = List([
    new GridColumn({
        index: 'name',
        title: 'Name'
    }),
    new GridColumn({
        index: 'label',
        title: 'Label'
    }),
    new GridColumn({
        index: 'rangeURI',
        title: 'Range URI'
    }),
    new GridColumn({
        index: 'conceptURI',
        title: 'Concept URI'
    }),
    new GridColumn({
        index: 'required',
        title: 'Required'
    }),
    new GridColumn({
        index: 'scale',
        title: 'Scale'
    })
]);