import { List, Record } from 'immutable';

import {
    ATTACHMENT_RANGE_URI,
    BINARY_RANGE_URI,
    BOOLEAN_RANGE_URI,
    DATE_RANGE_URI,
    DATETIME_RANGE_URI,
    DECIMAL_RANGE_URI,
    DOUBLE_RANGE_URI,
    FILELINK_RANGE_URI,
    FLAG_CONCEPT_URI,
    FLOAT_RANGE_URI,
    INT_RANGE_URI,
    LONG_RANGE_URI,
    MULTILINE_RANGE_URI,
    PARTICIPANTID_CONCEPT_URI,
    SAMPLE_TYPE_CONCEPT_URI,
    CONCEPT_CODE_CONCEPT_URI,
    STRING_RANGE_URI,
    TIME_RANGE_URI,
    USER_RANGE_URI,
} from './constants';

export type JsonType = 'boolean' | 'date' | 'float' | 'int' | 'string';

interface IPropDescType {
    conceptURI: string;
    display: string;
    name: string;
    rangeURI: string;
    shortDisplay?: string;
    lookupSchema?: string;
    lookupQuery?: string;
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
    implements IPropDescType {
    conceptURI: string;
    display: string;
    name: string;
    rangeURI: string;
    alternateRangeURI: string;
    shortDisplay: string;
    lookupSchema?: string;
    lookupQuery?: string;

    static isUser(name: string): boolean {
        return name === 'users';
    }

    static isSample(conceptURI: string): boolean {
        return conceptURI === SAMPLE_TYPE_CONCEPT_URI;
    }

    static isOntologyLookup(conceptURI: string): boolean {
        return conceptURI === CONCEPT_CODE_CONCEPT_URI;
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
        return dataType.display === AUTOINT_TYPE.display;
    }

    getJsonType(): JsonType {
        switch (this.name) {
            case 'boolean':
                return 'boolean';
            case 'int':
                return 'int';
            case 'double':
                return 'float';
            case 'dateTime':
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
    alternateRangeURI: 'xsd:int',
});

export const PROP_DESC_TYPES = List([
    TEXT_TYPE,
    MULTILINE_TYPE,
    BOOLEAN_TYPE,
    INTEGER_TYPE,
    DOUBLE_TYPE,
    DATETIME_TYPE,
    FLAG_TYPE,
    FILE_TYPE,
    ATTACHMENT_TYPE,
    USERS_TYPE,
    PARTICIPANT_TYPE,
    LOOKUP_TYPE,
    SAMPLE_TYPE,
    ONTOLOGY_LOOKUP_TYPE,
]);

export const READONLY_DESC_TYPES = List([BINARY_TYPE, DATE_TYPE, DECIMAL_TYPE, FLOAT_TYPE, LONG_TYPE, TIME_TYPE]);
