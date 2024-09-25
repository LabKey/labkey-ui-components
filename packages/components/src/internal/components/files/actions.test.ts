import { Map, fromJS } from 'immutable';

import { FileSizeLimitProps } from '../../../public/files/models';

import {
    convertRowDataIntoPreviewData,
    fileMatchesAcceptedFormat,
    fileSizeLimitCompare,
    getFileExtension,
} from './actions';

const DATA = fromJS([
    ['str', 'int', 'int-excelupload', 'double', 'date'],
    ['abc', 1, 123.0, 1.23, '2019-01-01'],
    ['def', 2, 456.0, 4.56, '2019-01-02'],
    ['ghi', 3, 789.0, 7.89, '2019-01-03'],
]);

const FIELDS = fromJS([
    {
        conceptURI: null,
        defaultValue: null,
        description: null,
        format: null,
        hidden: false,
        multiValue: false,
        name: 'str',
        rangeURI: 'xsd:string',
        required: false,
        shownInDetailsView: true,
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        removeFromViews: false,
    },
    {
        conceptURI: null,
        defaultValue: null,
        description: null,
        format: null,
        hidden: false,
        multiValue: false,
        name: 'int',
        rangeURI: 'xsd:int',
        required: false,
        shownInDetailsView: true,
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        removeFromViews: false,
    },
    {
        conceptURI: null,
        defaultValue: null,
        description: null,
        format: null,
        hidden: false,
        multiValue: false,
        name: 'int-excelupload',
        rangeURI: 'xsd:int',
        required: false,
        shownInDetailsView: true,
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        removeFromViews: false,
    },
    {
        conceptURI: null,
        defaultValue: null,
        description: null,
        format: null,
        hidden: false,
        multiValue: false,
        name: 'double',
        rangeURI: 'xsd:double',
        required: false,
        shownInDetailsView: true,
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        removeFromViews: false,
    },
    {
        conceptURI: null,
        defaultValue: null,
        description: null,
        format: null,
        hidden: false,
        multiValue: false,
        name: 'date',
        rangeURI: 'xsd:dateTime',
        required: false,
        shownInDetailsView: true,
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        removeFromViews: false,
    },
]);

describe('convertRowDataIntoPreviewData', () => {
    test('empty data object', () => {
        const rows = convertRowDataIntoPreviewData(fromJS([]), 1);
        expect(rows.size).toBe(0);
    });

    test('requesting less rows then data', () => {
        const rows = convertRowDataIntoPreviewData(DATA, 1);
        expect(rows.size).toBe(1);
        expect(rows.get(0).get('str')).toBe('abc');
        expect(rows.get(0).get('int')).toBe(1);
        expect(rows.get(0).get('int-excelupload')).toBe(123.0);
        expect(rows.get(0).get('double')).toBe(1.23);
        expect(rows.get(0).get('date')).toBe('2019-01-01');
    });

    test('requesting more rows then data', () => {
        const rows = convertRowDataIntoPreviewData(DATA, 4);
        expect(rows.size).toBe(3);
        expect(rows.get(0).get('str')).toBe('abc');
        expect(rows.get(1).get('int')).toBe(2);
        expect(rows.get(2).get('date')).toBe('2019-01-03');
    });

    test('with fields passed in to format int column', () => {
        const rows = convertRowDataIntoPreviewData(DATA, 1, FIELDS);
        expect(rows.get(0).get('str')).toBe('abc');
        expect(rows.get(0).get('int')).toBe(1);
        expect(rows.get(0).get('int-excelupload')).toBe(123);
        expect(rows.get(0).get('double')).toBe(1.23);
        expect(rows.get(0).get('date')).toBe('2019-01-01');
    });
});

describe('getFileExtension', () => {
    test('with extension', () => {
        expect(getFileExtension('Test.me')).toBe('.me');
    });

    test('undefined filename', () => {
        expect(getFileExtension(undefined)).toBe(undefined);
    });

    test('no extension', () => {
        expect(getFileExtension('unending')).toBe('');
    });

    test('multiple extensions', () => {
        expect(getFileExtension('find.the.last.one')).toBe('.one');
    });

    test('multiple extensions, find first', () => {
        expect(getFileExtension('find.the.last.one', false)).toBe('.the.last.one');
    });
});

describe('fileMatchesAcceptedFormat', () => {
    test('not a match', () => {
        let response = fileMatchesAcceptedFormat('testing.txt', '.csv, .tsv, .xlsx');
        expect(response.extension).toBe('.txt');
        expect(response.isMatch).toBeFalsy();

        response = fileMatchesAcceptedFormat('testing.xls', '.csv, .tsv, .xlsx');
        expect(response.extension).toBe('.xls');
        expect(response.isMatch).toBeFalsy();
    });

    test('matches first', () => {
        const response = fileMatchesAcceptedFormat('testing.csv', '.csv, .tsv, .xlsx');
        expect(response.extension).toBe('.csv');
        expect(response.isMatch).toBeTruthy();
    });

    test('matches middle', () => {
        const response = fileMatchesAcceptedFormat('testing.tsv', '.csv, .tsv, .xlsx');
        expect(response.extension).toBe('.tsv');
        expect(response.isMatch).toBeTruthy();
    });

    test('matches last', () => {
        const response = fileMatchesAcceptedFormat('testing.xlsx', '.csv, .tsv, .xlsx');
        expect(response.extension).toBe('.xlsx');
        expect(response.isMatch).toBeTruthy();
    });

    test('no file extension', () => {
        const response = fileMatchesAcceptedFormat('testing', '.csv, .tsv, .xlsx');
        expect(response.extension).toBe('');
        expect(response.isMatch).toBeFalsy();
    });

    test('case sensitivity', () => {
        const response = fileMatchesAcceptedFormat('testing.XLSX', '.csv, .tsv, .xlsx');
        expect(response.extension).toBe('.XLSX');
        expect(response.isMatch).toBeTruthy();
    });

    test('multiple file extension', () => {
        let response = fileMatchesAcceptedFormat('testing.xar.xml', '.xar.xml');
        expect(response.extension).toBe('.xar.xml');
        expect(response.isMatch).toBeTruthy();

        response = fileMatchesAcceptedFormat('testing.xar.xml', '.xml');
        expect(response.extension).toBe('.xml');
        expect(response.isMatch).toBeTruthy();
    });
});

describe('fileSizeLimitCompare', () => {
    const file: File = {
        size: 1024,
        type: 'test',
        lastModified: 1,
        name: 'test.text',
        slice: jest.fn(),
        arrayBuffer: undefined,
        stream: undefined,
        text: undefined,
        webkitRelativePath: undefined,
    };

    test('no limits', () => {
        const result = fileSizeLimitCompare(file, Map<string, FileSizeLimitProps>());
        expect(result.isOversized).toBeFalsy();
        expect(result.isOversizedForPreview).toBeFalsy();
    });

    test('undefined limits', () => {
        const result = fileSizeLimitCompare(file, undefined);
        expect(result.isOversized).toBeFalsy();
        expect(result.isOversizedForPreview).toBeFalsy();
    });

    test('default size limits exceeded but not preview', () => {
        const defaultLimits = {
            maxSize: {
                value: 234,
                displayValue: '234B',
            },
            maxPreviewSize: {
                value: 2345,
                displayValue: '2345',
            },
        };
        const result = fileSizeLimitCompare(
            file,
            Map<string, FileSizeLimitProps>({
                all: defaultLimits,
            })
        );
        expect(result.isOversized).toBeTruthy();
        expect(result.isOversizedForPreview).toBeFalsy();
        expect(result.limits).toBe(defaultLimits);
    });

    test('default size limits not exceeded but preview exceeded', () => {
        const defaultLimits = {
            maxSize: {
                value: 2345,
                displayValue: '2345B',
            },
            maxPreviewSize: {
                value: 1,
                displayValue: 'just one',
            },
        };
        const result = fileSizeLimitCompare(
            file,
            Map<string, FileSizeLimitProps>({
                all: defaultLimits,
            })
        );
        expect(result.isOversized).toBeFalsy();
        expect(result.isOversizedForPreview).toBeTruthy();
        expect(result.limits).toBe(defaultLimits);
    });

    test('limit on all and extension', () => {
        const defaultLimits = {
            maxSize: {
                value: 2345,
                displayValue: '2345B',
            },
            maxPreviewSize: {
                value: 1,
                displayValue: 'just one',
            },
        };
        const textLimits = {
            maxSize: {
                value: 1023,
                displayValue: '1023"',
            },
            maxPreviewSize: {
                value: 3000,
                displayValue: '3000',
            },
        };
        const result = fileSizeLimitCompare(
            file,
            Map<string, FileSizeLimitProps>({
                all: defaultLimits,
                '.text': textLimits,
            })
        );
        expect(result.isOversized).toBeTruthy();
        expect(result.isOversizedForPreview).toBeFalsy();
        expect(result.limits).toStrictEqual(textLimits);
    });

    test('merge limits on all and extension', () => {
        const defaultLimits = {
            maxSize: {
                value: 2345,
                displayValue: 'oversized',
            },
            maxPreviewSize: {
                value: 1,
                displayValue: 'size for preview',
            },
        };
        const textLimits = {
            maxPreviewSize: {
                value: 3000,
            },
        };
        const result = fileSizeLimitCompare(
            file,
            Map<string, FileSizeLimitProps>({
                all: defaultLimits,
                '.text': textLimits,
                '.tsv': {
                    maxSize: {
                        value: 100,
                    },
                },
            })
        );
        expect(result.isOversized).toBeFalsy();
        expect(result.isOversizedForPreview).toBeFalsy();
        expect(result.limits).toStrictEqual({
            maxSize: {
                value: 2345,
                displayValue: 'oversized',
            },
            maxPreviewSize: {
                value: 3000,
            },
        });
    });
});
