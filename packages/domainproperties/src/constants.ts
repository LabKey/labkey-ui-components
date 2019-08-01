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

// TextFieldOptions
export const DOMAIN_FIELD_MAX_LENGTH = 'maxLength';
export const DOMAIN_FIELD_CUSTOM_LENGTH = 'customLength';
export const DOMAIN_FIELD_SCALE = 'scale';

export const DOMAIN_FIELD_NOT_LOCKED = "NotLocked"; // not locked, can change all properties
export const DOMAIN_FIELD_PARTIALLY_LOCKED = "PartiallyLocked"; // can't change name and type, for example, but can change other properties
export const DOMAIN_FIELD_FULLY_LOCKED = "FullyLocked"; // can't change any properties

export const SEVERITY_LEVEL_ERROR = "Error";
export const SEVERITY_LEVEL_WARN = "Warning";

// Default scale types
export const DEFAULT_SCALE_LINEAR = 'LINEAR';
export const DEFAULT_SCALE_LOG = 'LOG';

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

export const LK_URL_ENCODING_DOC = "https://www.labkey.org/Documentation/wiki-page.view?name=urlEncoding";

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