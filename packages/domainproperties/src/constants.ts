/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import {List} from "immutable";
import {GridColumn} from "@glass/base";

export const DOMAIN_FIELD_PREFIX = 'domainpropertiesrow';
export const DOMAIN_FIELD_NAME = 'name';
export const DOMAIN_FIELD_TYPE = 'type';
export const DOMAIN_FIELD_REQ = 'req';
export const DOMAIN_FIELD_DETAILS = 'details';
export const DOMAIN_FIELD_ADV = 'adv';
export const DOMAIN_FIELD_DELETE = 'delete';

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