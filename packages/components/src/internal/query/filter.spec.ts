import { Filter } from '@labkey/api';

import { formatDate } from '../util/Date';

import { getLabKeySql } from './filter';

const datePOSIX = 1596750283812; // Aug 6, 2020 14:44 America/PST
const testDate = new Date(datePOSIX);
const dateStr = formatDate(testDate, 'America/PST', 'YYYY-MM-dd');

const date2POSIX = 1597182283812; // Aug 11, 2020 14:44 America/PST
const testDate2 = new Date(date2POSIX);
const dateStr2 = formatDate(testDate2, 'America/PST', 'YYYY-MM-dd');

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

    test('eq, string, multipart field keys', () => {
        expect(getLabKeySql(Filter.create('StringField/Name', 'ABC', Filter.Types.Equals), 'string')).toEqual(
            '"StringField"."Name" = \'ABC\''
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

    test('date filter, eq', () => {
        expect(getLabKeySql(Filter.create('DateField', dateStr, Filter.Types.Equals), 'date')).toEqual(
            '"DateField" = \'2020-08-06\''
        );
    });

    test('date filter, neq OR null', () => {
        expect(getLabKeySql(Filter.create('DateField', dateStr, Filter.Types.NEQ_OR_NULL), 'date')).toEqual(
            '("DateField" IS NULL OR "DateField" <> \'2020-08-06\')'
        );
    });

    test('date filter, >', () => {
        expect(getLabKeySql(Filter.create('DateField', dateStr, Filter.Types.GT), 'date')).toEqual(
            '"DateField" > \'2020-08-06\''
        );
    });

    test('date filter, <=', () => {
        expect(getLabKeySql(Filter.create('DateField', dateStr, Filter.Types.LTE), 'date')).toEqual(
            '"DateField" <= \'2020-08-06\''
        );
    });

    test('date filter, between', () => {
        expect(
            getLabKeySql(Filter.create('DateField', dateStr + ',' + dateStr2, Filter.Types.BETWEEN), 'date')
        ).toEqual("\"DateField\" BETWEEN '2020-08-06' AND '2020-08-11'");
    });

    test('date filter, not between', () => {
        expect(
            getLabKeySql(Filter.create('DateField', dateStr + ',' + dateStr2, Filter.Types.NOT_BETWEEN), 'date')
        ).toEqual("\"DateField\" NOT BETWEEN '2020-08-06' AND '2020-08-11'");
    });

    test('filter types not supported', () => {
        expect(getLabKeySql(Filter.create('StringField', 'abc', Filter.Types.STARTS_WITH), 'string')).toBeNull();
        expect(
            getLabKeySql(Filter.create('StringField', 'abc', Filter.Types.DOES_NOT_START_WITH), 'string')
        ).toBeNull();
        expect(getLabKeySql(Filter.create('StringField', 'abc', Filter.Types.CONTAINS), 'string')).toBeNull();
        expect(getLabKeySql(Filter.create('StringField', 'abc', Filter.Types.DOES_NOT_CONTAIN), 'string')).toBeNull();
        expect(getLabKeySql(Filter.create('StringField', 'a;b;c', Filter.Types.CONTAINS_ONE_OF), 'string')).toBeNull();
        expect(getLabKeySql(Filter.create('StringField', 'a;b;c', Filter.Types.CONTAINS_NONE_OF), 'string')).toBeNull();
        expect(getLabKeySql(Filter.create('StringField', 'abc', Filter.Types.MEMBER_OF), 'string')).toBeNull();
    });
});
