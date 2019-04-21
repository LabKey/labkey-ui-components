/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import {List} from "immutable";
import {GridColumn} from "@glass/base";
import {PropDescType} from "./models";

export const DOMAIN_FIELD_PREFIX = 'dom-row-';
export const DOMAIN_FIELD_NAME = 'name';
export const DOMAIN_FIELD_TYPE = 'type';
export const DOMAIN_FIELD_REQ = 'req';
export const DOMAIN_FIELD_DETAILS = 'details';
export const DOMAIN_FIELD_ADV = 'adv';

export const TEXT_RANGE_URI = 'http://www.w3.org/2001/XMLSchema#string';

export const PropDescTypes = List([
    new PropDescType({name: 'string', display: 'Text (String)', rangeURI: TEXT_RANGE_URI}),
    new PropDescType({name: 'multiLine', display: 'Multi-Line Text', rangeURI: 'http://www.w3.org/2001/XMLSchema#multiLine'}),
    new PropDescType({name: 'boolean', display: 'Boolean', rangeURI: 'http://www.w3.org/2001/XMLSchema#boolean'}),
    new PropDescType({name: 'int', display: 'Integer', rangeURI: 'http://www.w3.org/2001/XMLSchema#int'}),
    new PropDescType({name: 'double', display: 'Number (Double)', rangeURI: 'http://www.w3.org/2001/XMLSchema#double'}),
    new PropDescType({name: 'dateTime', display: 'Date Time', rangeURI: 'http://www.w3.org/2001/XMLSchema#dateTime'}),
    new PropDescType({name: 'flag', display: 'Flag (String)', rangeURI: 'http://www.w3.org/2001/XMLSchema#string', conceptURI: 'http://www.labkey.org/exp/xml#flag'}),
    new PropDescType({name: 'fileLink', display: 'File', rangeURI: 'http://cpas.fhcrc.org/exp/xml#fileLink'}),
    new PropDescType({name: 'attachment', display: 'Attachment', rangeURI: 'http://www.labkey.org/exp/xml#attachment'}),
    new PropDescType({name: 'users', display: 'User', rangeURI: 'http://www.labkey.org/exp/xml#int'}),
    new PropDescType({name: 'ParticipantId', display: 'Subject/Participant (String)', rangeURI: 'http://www.w3.org/2001/XMLSchema#string', conceptURI: 'http://cpas.labkey.com/Study#ParticipantId'}),
    new PropDescType({name: 'lookup', display: 'Lookup'}),
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