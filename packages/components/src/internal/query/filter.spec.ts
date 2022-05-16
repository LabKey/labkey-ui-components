import { Filter } from '@labkey/api';

import { formatDate } from '../util/Date';

import { getLabKeySql } from './filter';

const datePOSIX = 1596750283812; // Aug 6, 2020 14:44 America/Los_Angeles
const testDate = new Date(datePOSIX);

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const dateStr = formatDate(testDate, 'America/Los_Angeles', 'YYYY-MM-dd');
const dateTimeStr = formatDate(testDate, timezone, 'YYYY-MM-dd HH:mm');

const date2POSIX = 1597182283812; // Aug 11, 2020 14:44 America/Los_Angeles
const testDate2 = new Date(date2POSIX);
const dateStr2 = formatDate(testDate2, 'America/Los_Angeles', 'YYYY-MM-dd');
const dateTimeStr2 = formatDate(testDate2, timezone, 'YYYY-MM-dd HH:mm');

describe('getLabKeySql', () => {
    test('has any value', () => {
        expect(getLabKeySql(Filter.create('StringField', null, Filter.Types.HAS_ANY_VALUE), 'string')).toBeNull();
    });

    test('simple operator, no filter value', () => {
        expect(getLabKeySql(Filter.create('LookupField/Name', null, Filter.Types.ISBLANK), 'string')).toEqual(
            '"LookupField"."Name" IS NULL'
        );
    });

    test('eq, string', () => {
        expect(getLabKeySql(Filter.create('StringField', 'ABC', Filter.Types.Equals), 'string')).toEqual(
            '"StringField" = \'ABC\''
        );
    });

    test('eq, string, with single quote in value', () => {
        const value = "with 'quote'";
        expect(getLabKeySql(Filter.create('StringField', value, Filter.Types.Equals), 'string')).toEqual(
            "\"StringField\" = 'with ''quote'''"
        );
    });

    test('eq, string, with double quote in value', () => {
        const value = 'with "quote"';
        expect(getLabKeySql(Filter.create('StringField', value, Filter.Types.Equals), 'string')).toEqual(
            '"StringField" = \'with "quote"\''
        );
    });

    test('eq, string, with single quote in field name', () => {
        const fieldName = "String'Field";
        expect(getLabKeySql(Filter.create(fieldName, 'ABC', Filter.Types.Equals), 'string')).toEqual(
            "\"String'Field\" = 'ABC'"
        );
    });

    test('eq, string, with double quote in field name', () => {
        const fieldName = 'String"Field';
        expect(getLabKeySql(Filter.create(fieldName, 'ABC', Filter.Types.Equals), 'string')).toEqual(
            '"String""Field" = \'ABC\''
        );
    });

    test('eq, string, with multiple double quotes in field name', () => {
        const fieldName = 'String"F"ield';
        expect(getLabKeySql(Filter.create(fieldName, 'ABC', Filter.Types.Equals), 'string')).toEqual(
            '"String""F""ield" = \'ABC\''
        );
    });

    test('eq, string, with comma in field name', () => {
        const fieldName = 'With$CCom$Cma';
        expect(getLabKeySql(Filter.create(fieldName, 'ABC', Filter.Types.Equals), 'string')).toEqual(
            '"With,Com,ma" = \'ABC\''
        );
    });

    test('eq, string, with other special characters in field name', () => {
        const fieldName = 'Part$D1/Special$S$A$B$T$PChars';
        expect(getLabKeySql(Filter.create(fieldName, 'ABC', Filter.Types.Equals), 'string')).toEqual(
            '"Part$1"."Special/&}~.Chars" = \'ABC\''
        );
    });

    test('eq, string, multipart field keys', () => {
        expect(getLabKeySql(Filter.create('StringField/Name', 'ABC', Filter.Types.Equals), 'string')).toEqual(
            '"StringField"."Name" = \'ABC\''
        );
    });

    test('startsWith', () => {
        expect(getLabKeySql(Filter.create('StringField', 'ABC', Filter.Types.STARTS_WITH), 'string')).toEqual(
            "LOWER(\"StringField\") LIKE LOWER('ABC%') ESCAPE '!'"
        );
    });

    test('startsWith, contains quote', () => {
        expect(getLabKeySql(Filter.create('StringField', "AB'C", Filter.Types.STARTS_WITH), 'string')).toEqual(
            "LOWER(\"StringField\") LIKE LOWER('AB''C%') ESCAPE '!'"
        );
    });

    test('not startsWith', () => {
        expect(getLabKeySql(Filter.create('StringField', 'ABC', Filter.Types.DOES_NOT_START_WITH), 'string')).toEqual(
            '("StringField" IS NULL) OR (LOWER("StringField") NOT LIKE LOWER(\'ABC%\') ESCAPE \'!\')'
        );
    });

    test('contains', () => {
        expect(getLabKeySql(Filter.create('StringField', 'ABC', Filter.Types.CONTAINS), 'string')).toEqual(
            "LOWER(\"StringField\") LIKE LOWER('%ABC%') ESCAPE '!'"
        );
    });

    test('not contains', () => {
        expect(getLabKeySql(Filter.create('StringField', 'ABC', Filter.Types.DOES_NOT_CONTAIN), 'string')).toEqual(
            '("StringField" IS NULL) OR (LOWER("StringField") NOT LIKE LOWER(\'%ABC%\') ESCAPE \'!\')'
        );
    });

    test('not contains, with quote', () => {
        expect(getLabKeySql(Filter.create('StringField', "AB'C", Filter.Types.DOES_NOT_CONTAIN), 'string')).toEqual(
            "(\"StringField\" IS NULL) OR (LOWER(\"StringField\") NOT LIKE LOWER('%AB''C%') ESCAPE '!')"
        );
    });

    test('neq OR null', () => {
        expect(getLabKeySql(Filter.create('StringField', 'ABC', Filter.Types.NEQ_OR_NULL), 'string')).toEqual(
            '("StringField" IS NULL OR "StringField" <> \'ABC\')'
        );
    });

    test('>, int', () => {
        expect(getLabKeySql(Filter.create('IntField', 1, Filter.Types.GT), 'int')).toEqual('"IntField" > 1');
    });

    test('value list, string', () => {
        expect(getLabKeySql(Filter.create('StringField', 'value1;value2;value3', Filter.Types.IN), 'string')).toEqual(
            "(\"StringField\" IN ('value1', 'value2', 'value3'))"
        );
    });

    test('value list, include null, string', () => {
        expect(getLabKeySql(Filter.create('StringField', 'value1;value2;;value3', Filter.Types.IN), 'string')).toEqual(
            "(\"StringField\" IN ('value1', 'value2', '', 'value3') OR \"StringField\" IS NULL)"
        );
    });

    test('value list, string, exclusion', () => {
        expect(
            getLabKeySql(
                Filter.create('StringField', 'value1;value2;value3;value4;value5;value6;value7', Filter.Types.NOT_IN),
                'string'
            )
        ).toEqual(
            "(\"StringField\" NOT IN ('value1', 'value2', 'value3', 'value4', 'value5', 'value6', 'value7') OR \"StringField\" IS NULL)"
        );
    });

    test('value list, string, exclusion, exclude null', () => {
        expect(
            getLabKeySql(
                Filter.create('StringField', 'value1;value2;value3;;value4;value5;value6;value7', Filter.Types.NOT_IN),
                'string'
            )
        ).toEqual(
            "(\"StringField\" NOT IN ('value1', 'value2', 'value3', '', 'value4', 'value5', 'value6', 'value7') AND \"StringField\" IS NOT NULL)"
        );
    });

    test('value list, int', () => {
        expect(getLabKeySql(Filter.create('IntField', '1;2;3', Filter.Types.IN), 'int')).toEqual(
            '("IntField" IN (1, 2, 3))'
        );
    });

    test('value list, float, exclusion', () => {
        expect(getLabKeySql(Filter.create('FloatField', '1.1;2.2;3.3', Filter.Types.NOT_IN), 'float')).toEqual(
            '("FloatField" NOT IN (1.1, 2.2, 3.3) OR "FloatField" IS NULL)'
        );
    });

    test('between, int', () => {
        expect(getLabKeySql(Filter.create('IntField', '1,100', Filter.Types.BETWEEN), 'int')).toEqual(
            '"IntField" BETWEEN 1 AND 100'
        );
    });

    test('not between, int', () => {
        expect(getLabKeySql(Filter.create('IntField', '1,100', Filter.Types.NOT_BETWEEN), 'int')).toEqual(
            '"IntField" NOT BETWEEN 1 AND 100'
        );
    });

    test('between, float', () => {
        expect(getLabKeySql(Filter.create('FloatField', '1.1,5.5', Filter.Types.BETWEEN), 'float')).toEqual(
            '"FloatField" BETWEEN 1.1 AND 5.5'
        );
    });

    test('not between, float', () => {
        expect(getLabKeySql(Filter.create('FloatField', '1.1,5.5', Filter.Types.NOT_BETWEEN), 'float')).toEqual(
            '"FloatField" NOT BETWEEN 1.1 AND 5.5'
        );
    });

    test('boolean filter, eq', () => {
        expect(getLabKeySql(Filter.create('BooleanField', 'true', Filter.Types.Equals), 'boolean')).toEqual(
            '"BooleanField" = TRUE'
        );
    });

    test('between, string', () => {
        expect(getLabKeySql(Filter.create('StringField', 'h,n', Filter.Types.BETWEEN), 'string')).toEqual(
            "\"StringField\" BETWEEN 'h' AND 'n'"
        );
    });

    test('not between, string', () => {
        expect(getLabKeySql(Filter.create('StringField', 'h,n', Filter.Types.NOT_BETWEEN), 'string')).toEqual(
            "\"StringField\" NOT BETWEEN 'h' AND 'n'"
        );
    });

    test('contains one of, values list', () => {
        expect(
            getLabKeySql(Filter.create('StringField', 'value1;value2;value3', Filter.Types.CONTAINS_ONE_OF), 'string')
        ).toEqual(
            "((LOWER(\"StringField\") LIKE LOWER('%value1%') ESCAPE '!') OR (LOWER(\"StringField\") LIKE LOWER('%value2%') ESCAPE '!') OR (LOWER(\"StringField\") LIKE LOWER('%value3%') ESCAPE '!'))"
        );
    });

    test('contains one of, single value', () => {
        expect(getLabKeySql(Filter.create('StringField', 'value1', Filter.Types.CONTAINS_ONE_OF), 'string')).toEqual(
            "LOWER(\"StringField\") LIKE LOWER('%value1%') ESCAPE '!'"
        );
    });

    test('contains one of, single blank value', () => {
        expect(getLabKeySql(Filter.create('StringField', '', Filter.Types.CONTAINS_ONE_OF), 'string')).toEqual(
            '"StringField" IS NULL'
        );
    });

    test('contains one of, values list, contains blank', () => {
        expect(
            getLabKeySql(Filter.create('StringField', 'value1;;values2', Filter.Types.CONTAINS_ONE_OF), 'string')
        ).toEqual(
            "((LOWER(\"StringField\") LIKE LOWER('%value1%') ESCAPE '!') OR (LOWER(\"StringField\") LIKE LOWER('%values2%') ESCAPE '!')) OR (\"StringField\" IS NULL)"
        );
    });

    test('contains none of, values list', () => {
        expect(
            getLabKeySql(Filter.create('StringField', 'value1;value2;value3', Filter.Types.CONTAINS_NONE_OF), 'string')
        ).toEqual(
            "((LOWER(\"StringField\") NOT LIKE LOWER('%value1%') ESCAPE '!') AND (LOWER(\"StringField\") NOT LIKE LOWER('%value2%') ESCAPE '!') AND (LOWER(\"StringField\") NOT LIKE LOWER('%value3%') ESCAPE '!')) OR (\"StringField\" IS NULL)"
        );
    });

    test('contains none of, single value', () => {
        expect(getLabKeySql(Filter.create('StringField', 'value1', Filter.Types.CONTAINS_NONE_OF), 'string')).toEqual(
            '("StringField" IS NULL) OR (LOWER("StringField") NOT LIKE LOWER(\'%value1%\') ESCAPE \'!\')'
        );
    });

    test('contains none of, single blank value', () => {
        expect(getLabKeySql(Filter.create('StringField', '', Filter.Types.CONTAINS_NONE_OF), 'string')).toEqual(
            '"StringField" IS NOT NULL'
        );
    });

    test('contains none of, values list, contains blank', () => {
        expect(
            getLabKeySql(Filter.create('StringField', 'value1;;values2', Filter.Types.CONTAINS_NONE_OF), 'string')
        ).toEqual(
            "((LOWER(\"StringField\") NOT LIKE LOWER('%value1%') ESCAPE '!') AND (LOWER(\"StringField\") NOT LIKE LOWER('%values2%') ESCAPE '!')) AND (\"StringField\" IS NOT NULL)"
        );
    });

    test('date filter, eq', () => {
        expect(getLabKeySql(Filter.create('DateField', dateStr, Filter.Types.DATE_EQUAL), 'date')).toEqual(
            '("DateField" >= \'2020-08-06\' AND "DateField" < \'2020-08-07\')'
        );
    });

    test('datetime filter, eq', () => {
        expect(getLabKeySql(Filter.create('DateField', dateTimeStr, Filter.Types.DATE_EQUAL), 'date')).toEqual(
            '"DateField" = \'' + dateTimeStr + "'"
        );
    });

    test('date filter, neq', () => {
        expect(getLabKeySql(Filter.create('DateField', dateStr, Filter.Types.DATE_NOT_EQUAL), 'date')).toEqual(
            '("DateField" < \'2020-08-06\' OR "DateField" >= \'2020-08-07\')'
        );
    });

    test('datetime filter, neq', () => {
        expect(getLabKeySql(Filter.create('DateField', dateTimeStr, Filter.Types.DATE_NOT_EQUAL), 'date')).toEqual(
            '"DateField" <> \'' + dateTimeStr + "'"
        );
    });

    test('date filter, >', () => {
        expect(getLabKeySql(Filter.create('DateField', dateStr, Filter.Types.DATE_GREATER_THAN), 'date')).toEqual(
            '("DateField" >= \'2020-08-07\')'
        );
    });

    test('datetime filter, >', () => {
        expect(getLabKeySql(Filter.create('DateField', dateTimeStr, Filter.Types.DATE_GREATER_THAN), 'date')).toEqual(
            '"DateField" > \'' + dateTimeStr + "'"
        );
    });

    test('date filter, >=', () => {
        expect(
            getLabKeySql(Filter.create('DateField', dateStr, Filter.Types.DATE_GREATER_THAN_OR_EQUAL), 'date')
        ).toEqual('("DateField" >= \'2020-08-06\')');
    });

    test('datetime filter, >=', () => {
        expect(
            getLabKeySql(Filter.create('DateField', dateTimeStr, Filter.Types.DATE_GREATER_THAN_OR_EQUAL), 'date')
        ).toEqual('"DateField" >= \'' + dateTimeStr + "'");
    });

    test('date filter, <=', () => {
        expect(getLabKeySql(Filter.create('DateField', dateStr, Filter.Types.DATE_LESS_THAN_OR_EQUAL), 'date')).toEqual(
            '("DateField" < \'2020-08-07\')'
        );
    });

    test('datetime filter, <=', () => {
        expect(
            getLabKeySql(Filter.create('DateField', dateTimeStr, Filter.Types.DATE_LESS_THAN_OR_EQUAL), 'date')
        ).toEqual('"DateField" <= \'' + dateTimeStr + "'");
    });

    test('date filter, <', () => {
        expect(getLabKeySql(Filter.create('DateField', dateStr, Filter.Types.DATE_LESS_THAN), 'date')).toEqual(
            '("DateField" < \'2020-08-06\')'
        );
    });

    test('datetime filter, <', () => {
        expect(getLabKeySql(Filter.create('DateField', dateTimeStr, Filter.Types.DATE_LESS_THAN), 'date')).toEqual(
            '"DateField" < \'' + dateTimeStr + "'"
        );
    });

    test('date filter, between', () => {
        expect(
            getLabKeySql(Filter.create('DateField', dateStr + ',' + dateStr2, Filter.Types.BETWEEN), 'date')
        ).toEqual('("DateField" >= \'2020-08-06\' AND "DateField" < \'2020-08-12\')');
    });

    test('datetime filter, between', () => {
        expect(
            getLabKeySql(Filter.create('DateField', dateTimeStr + ',' + dateTimeStr2, Filter.Types.BETWEEN), 'date')
        ).toEqual('"DateField" BETWEEN \'' + dateTimeStr + "' AND '" + dateTimeStr2 + "'");
    });

    test('date filter, not between', () => {
        expect(
            getLabKeySql(Filter.create('DateField', dateStr + ',' + dateStr2, Filter.Types.NOT_BETWEEN), 'date')
        ).toEqual('("DateField" < \'2020-08-06\' OR "DateField" >= \'2020-08-12\')');
    });

    test('datetime filter, not between', () => {
        expect(
            getLabKeySql(Filter.create('DateField', dateTimeStr + ',' + dateTimeStr2, Filter.Types.NOT_BETWEEN), 'date')
        ).toEqual('"DateField" NOT BETWEEN \'' + dateTimeStr + "' AND '" + dateTimeStr2 + "'");
    });

    test('ontology subtree, single path', () => {
        expect(
            getLabKeySql(Filter.create('OntologyField', 'NCIT:ST1000027', Filter.Types.ONTOLOGY_IN_SUBTREE), 'string')
        ).toEqual('IsInSubtree("OntologyField", ConceptPath(\'NCIT:ST1000027\'))');
    });

    test('ontology subtree, multi path', () => {
        expect(
            getLabKeySql(
                Filter.create('OntologyField', 'NCIT:ST1000027/NCIT:ST3527', Filter.Types.ONTOLOGY_IN_SUBTREE),
                'string'
            )
        ).toEqual("IsInSubtree(\"OntologyField\", ConceptPath('NCIT:ST1000027', 'NCIT:ST3527'))");
    });

    test('ontology not in subtree, single path', () => {
        expect(
            getLabKeySql(
                Filter.create('OntologyField', 'NCIT:ST1000027', Filter.Types.ONTOLOGY_NOT_IN_SUBTREE),
                'string'
            )
        ).toEqual('NOT IsInSubtree("OntologyField", ConceptPath(\'NCIT:ST1000027\'))');
    });

    test('ontology not in subtree, multi path', () => {
        expect(
            getLabKeySql(
                Filter.create('OntologyField', 'NCIT:ST1000027/NCIT:ST3527', Filter.Types.ONTOLOGY_NOT_IN_SUBTREE),
                'string'
            )
        ).toEqual("NOT IsInSubtree(\"OntologyField\", ConceptPath('NCIT:ST1000027', 'NCIT:ST3527'))");
    });

    test('filter types not supported', () => {
        expect(getLabKeySql(Filter.create('StringField', 'abc', Filter.Types.MEMBER_OF), 'string')).toBeNull();
    });
});
