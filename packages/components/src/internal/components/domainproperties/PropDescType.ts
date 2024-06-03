import { List, Record } from 'immutable';

import {
    ATTACHMENT_RANGE_URI,
    AUTO_INT_CONCEPT_URI,
    BINARY_RANGE_URI,
    BOOLEAN_RANGE_URI,
    CONCEPT_CODE_CONCEPT_URI,
    CREATED_TIMESTAMP_CONCEPT_URI,
    DATE_RANGE_URI,
    DATETIME_RANGE_URI,
    DECIMAL_RANGE_URI,
    DOUBLE_RANGE_URI,
    FILELINK_RANGE_URI,
    FLAG_CONCEPT_URI,
    FLOAT_RANGE_URI,
    INT_RANGE_URI,
    LONG_RANGE_URI,
    MODIFIED_TIMESTAMP_CONCEPT_URI,
    MULTILINE_RANGE_URI,
    PARTICIPANTID_CONCEPT_URI,
    SAMPLE_TYPE_CONCEPT_URI,
    SMILES_CONCEPT_URI,
    STORAGE_UNIQUE_ID_CONCEPT_URI,
    STRING_RANGE_URI,
    TEXT_CHOICE_CONCEPT_URI,
    TIME_RANGE_URI,
    USER_RANGE_URI,
    VISITID_CONCEPT_URI,
} from './constants';

export type JsonType = 'boolean' | 'date' | 'float' | 'int' | 'string' | 'time';

interface IPropDescType {
    conceptURI: string;
    display: string;
    lookupQuery?: string;
    lookupSchema?: string;
    name: string;
    rangeURI: string;
    shortDisplay?: string;
}

export class PropDescType
    extends Record({
        conceptURI: undefined,
        display: undefined,
        name: undefined,
        rangeURI: undefined,
        alternateRangeURI: undefined,
        shortDisplay: undefined,
        lookupSchema: undefined,
        lookupQuery: undefined,
    })
    implements IPropDescType
{
    declare conceptURI: string;
    declare display: string;
    declare name: string;
    declare rangeURI: string;
    declare alternateRangeURI: string;
    declare shortDisplay: string;
    declare lookupSchema?: string;
    declare lookupQuery?: string;

    static fromName(name: string): PropDescType {
        return PROP_DESC_TYPES.find(type => type.name === name);
    }

    static isUser(name: string): boolean {
        return name === 'users';
    }

    static isSample(conceptURI: string): boolean {
        return conceptURI === SAMPLE_TYPE_CONCEPT_URI;
    }

    static isOntologyLookup(conceptURI: string): boolean {
        return conceptURI === CONCEPT_CODE_CONCEPT_URI;
    }

    static isUniqueIdField(conceptURI: string): boolean {
        return conceptURI === STORAGE_UNIQUE_ID_CONCEPT_URI;
    }

    static isTextChoice(name: string): boolean {
        // in the case of the field editor row data type select input change, the field input name is provided
        // so check for that case here as well
        return name === TEXT_CHOICE_CONCEPT_URI || name === 'textChoice';
    }

    static isLookup(name: string): boolean {
        return name === 'lookup';
    }

    static isInteger(rangeURI: string): boolean {
        return rangeURI === INT_RANGE_URI || rangeURI === USER_RANGE_URI;
    }

    static isNumeric(rangeURI: string): boolean {
        return (
            this.isInteger(rangeURI) ||
            rangeURI === DECIMAL_RANGE_URI ||
            rangeURI === DOUBLE_RANGE_URI ||
            rangeURI === FLOAT_RANGE_URI ||
            rangeURI === LONG_RANGE_URI
        );
    }

    static isString(rangeURI: string): boolean {
        return rangeURI === STRING_RANGE_URI || rangeURI === MULTILINE_RANGE_URI;
    }

    static isTime(rangeURI: string): boolean {
        return rangeURI === TIME_RANGE_URI;
    }

    static isDate(rangeURI: string): boolean {
        return rangeURI === DATE_RANGE_URI;
    }

    static isDateTime(rangeURI: string): boolean {
        return rangeURI === DATETIME_RANGE_URI;
    }

    static isMeasure(rangeURI: string): boolean {
        return rangeURI !== ATTACHMENT_RANGE_URI && rangeURI !== FILELINK_RANGE_URI;
    }

    static isDimension(rangeURI: string): boolean {
        return (
            rangeURI === BOOLEAN_RANGE_URI ||
            rangeURI === DOUBLE_RANGE_URI ||
            rangeURI === INT_RANGE_URI ||
            rangeURI === STRING_RANGE_URI
        );
    }

    static isMvEnableable(rangeURI: string): boolean {
        return rangeURI !== ATTACHMENT_RANGE_URI && rangeURI !== FILELINK_RANGE_URI && rangeURI !== MULTILINE_RANGE_URI;
    }

    static isAutoIncrement(dataType: PropDescType): boolean {
        return dataType?.display === AUTOINT_TYPE.display;
    }

    getJsonType(): JsonType {
        // TODO should this change to default to returning this.name and just catch the diff cases?
        switch (this.name) {
            case 'boolean':
                return 'boolean';
            case 'int':
                return 'int';
            case 'double':
                return 'float';
            case 'dateTime':
            case 'date':
                return 'date';
            default:
                return 'string';
        }
    }

    isUser(): boolean {
        return PropDescType.isUser(this.name);
    }

    isLookup(): boolean {
        return PropDescType.isLookup(this.name);
    }

    isInteger(): boolean {
        return PropDescType.isInteger(this.rangeURI);
    }

    isNumeric(): boolean {
        return PropDescType.isNumeric(this.rangeURI);
    }

    isString(): boolean {
        return PropDescType.isString(this.rangeURI);
    }

    isFileType(): boolean {
        return this === FILE_TYPE || this === ATTACHMENT_TYPE;
    }

    isSample(): boolean {
        return PropDescType.isSample(this.conceptURI);
    }

    isOntologyLookup(): boolean {
        return PropDescType.isOntologyLookup(this.conceptURI);
    }

    isUniqueId(): boolean {
        return PropDescType.isUniqueIdField(this.conceptURI);
    }

    isTextChoice(): boolean {
        return PropDescType.isTextChoice(this.conceptURI);
    }

    isTime(): boolean {
        return PropDescType.isTime(this.rangeURI);
    }

    isDate(): boolean {
        return PropDescType.isDate(this.rangeURI);
    }

    isDateTime(): boolean {
        return PropDescType.isDateTime(this.rangeURI);
    }
}

export const TEXT_TYPE = new PropDescType({
    name: 'string',
    display: 'Text',
    rangeURI: STRING_RANGE_URI,
    alternateRangeURI: 'xsd:string',
    shortDisplay: 'String',
});
export const LOOKUP_TYPE = new PropDescType({ name: 'lookup', display: 'Lookup' });
export const MULTILINE_TYPE = new PropDescType({
    name: 'multiLine',
    display: 'Multi-Line Text',
    rangeURI: MULTILINE_RANGE_URI,
});
export const BOOLEAN_TYPE = new PropDescType({
    name: 'boolean',
    display: 'Boolean',
    rangeURI: BOOLEAN_RANGE_URI,
    alternateRangeURI: 'xsd:boolean',
});
export const INTEGER_TYPE = new PropDescType({
    name: 'int',
    display: 'Integer',
    rangeURI: INT_RANGE_URI,
    alternateRangeURI: 'xsd:int',
});
export const DOUBLE_TYPE = new PropDescType({
    name: 'double',
    display: 'Decimal (floating point)',
    rangeURI: DOUBLE_RANGE_URI,
    alternateRangeURI: 'xsd:double',
});
export const DATETIME_TYPE = new PropDescType({
    name: 'dateTime',
    display: 'Date Time',
    rangeURI: DATETIME_RANGE_URI,
    alternateRangeURI: 'xsd:dateTime',
});
export const FLAG_TYPE = new PropDescType({
    name: 'flag',
    display: 'Flag',
    rangeURI: STRING_RANGE_URI,
    conceptURI: FLAG_CONCEPT_URI,
});
export const FILE_TYPE = new PropDescType({ name: 'fileLink', display: 'File', rangeURI: FILELINK_RANGE_URI });
export const ATTACHMENT_TYPE = new PropDescType({
    name: 'attachment',
    display: 'Attachment',
    rangeURI: ATTACHMENT_RANGE_URI,
});
export const USERS_TYPE = new PropDescType({
    name: 'users',
    display: 'User',
    rangeURI: INT_RANGE_URI,
    lookupSchema: 'core',
    lookupQuery: 'users',
});
export const PARTICIPANT_TYPE = new PropDescType({
    name: 'ParticipantId',
    display: 'Subject/Participant',
    rangeURI: STRING_RANGE_URI,
    conceptURI: PARTICIPANTID_CONCEPT_URI,
});
export const SAMPLE_TYPE = new PropDescType({
    name: 'sample',
    display: 'Sample',
    rangeURI: INT_RANGE_URI,
    conceptURI: SAMPLE_TYPE_CONCEPT_URI,
});
export const ONTOLOGY_LOOKUP_TYPE = new PropDescType({
    name: 'ontologyLookup',
    display: 'Ontology Lookup',
    rangeURI: STRING_RANGE_URI,
    conceptURI: CONCEPT_CODE_CONCEPT_URI,
});

export const BINARY_TYPE = new PropDescType({ name: 'binary', display: 'Byte Buffer', rangeURI: BINARY_RANGE_URI });
export const DATE_TYPE = new PropDescType({ name: 'date', display: 'Date', rangeURI: DATE_RANGE_URI });
export const DECIMAL_TYPE = new PropDescType({
    name: 'decimal',
    display: 'Decimal (fixed point)',
    rangeURI: DECIMAL_RANGE_URI,
});
export const FLOAT_TYPE = new PropDescType({ name: 'float', display: 'Float', rangeURI: FLOAT_RANGE_URI });
export const LONG_TYPE = new PropDescType({ name: 'long', display: 'Long Integer', rangeURI: LONG_RANGE_URI });
export const TIME_TYPE = new PropDescType({ name: 'time', display: 'Time', rangeURI: TIME_RANGE_URI });
export const AUTOINT_TYPE = new PropDescType({
    name: 'int',
    display: 'Auto Increment',
    rangeURI: INT_RANGE_URI,
    conceptURI: AUTO_INT_CONCEPT_URI,
    alternateRangeURI: 'xsd:int',
});

export const VISIT_DATE_TYPE = new PropDescType({
    name: 'visitDate',
    display: 'Visit Date',
    rangeURI: DATETIME_RANGE_URI,
    conceptURI: VISITID_CONCEPT_URI,
});
export const VISIT_ID_TYPE = new PropDescType({
    name: 'visitId',
    display: 'Visit ID',
    rangeURI: DOUBLE_RANGE_URI,
    conceptURI: VISITID_CONCEPT_URI,
});

export const UNIQUE_ID_TYPE = new PropDescType({
    name: 'uniqueId',
    display: 'Unique ID',
    rangeURI: STRING_RANGE_URI,
    conceptURI: STORAGE_UNIQUE_ID_CONCEPT_URI,
});

export const TEXT_CHOICE_TYPE = new PropDescType({
    name: 'textChoice',
    display: 'Text Choice',
    rangeURI: STRING_RANGE_URI,
    conceptURI: TEXT_CHOICE_CONCEPT_URI,
});

export const SMILES_TYPE = new PropDescType({
    name: 'smiles',
    display: 'SMILES',
    rangeURI: STRING_RANGE_URI,
    conceptURI: SMILES_CONCEPT_URI,
});

export const PROP_DESC_TYPES = List([
    TEXT_TYPE,
    MULTILINE_TYPE,
    BOOLEAN_TYPE,
    INTEGER_TYPE,
    DOUBLE_TYPE,
    DATE_TYPE,
    TIME_TYPE,
    DATETIME_TYPE,
    FLAG_TYPE,
    FILE_TYPE,
    ATTACHMENT_TYPE,
    USERS_TYPE,
    PARTICIPANT_TYPE,
    LOOKUP_TYPE,
    SAMPLE_TYPE,
    SMILES_TYPE,
    ONTOLOGY_LOOKUP_TYPE,
    VISIT_DATE_TYPE,
    VISIT_ID_TYPE,
    UNIQUE_ID_TYPE,
    TEXT_CHOICE_TYPE,
    AUTOINT_TYPE,
]);

export const READONLY_DESC_TYPES = List([BINARY_TYPE, DATE_TYPE, DECIMAL_TYPE, FLOAT_TYPE, LONG_TYPE, TIME_TYPE]);
export const CONCEPT_URIS_NOT_USED_IN_TYPES = List([CREATED_TIMESTAMP_CONCEPT_URI, MODIFIED_TIMESTAMP_CONCEPT_URI]);

export const STUDY_PROPERTY_TYPES = [PARTICIPANT_TYPE, VISIT_DATE_TYPE, VISIT_ID_TYPE];
