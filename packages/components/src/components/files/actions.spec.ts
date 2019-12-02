import { fromJS } from 'immutable'
import { convertRowDataIntoPreviewData, fileMatchesAcceptedFormat } from './actions';

const DATA = fromJS([
    ['str', 'int', 'int-excelupload', 'double', 'date'],
    ['abc', 1, 123.0, 1.23, '2019-01-01'],
    ['def', 2, 456.0, 4.56, '2019-01-02'],
    ['ghi', 3, 789.0, 7.89, '2019-01-03']
]);

const FIELDS = fromJS([{
    "conceptURI": null,
    "defaultValue": null,
    "description": null,
    "format": null,
    "hidden": false,
    "multiValue": false,
    "name": "str",
    "rangeURI": "xsd:string",
    "required": false,
    "shownInDetailsView": true,
    "shownInInsertView": true,
    "shownInUpdateView": true,
    "sortable": true,
    "removeFromViews": false
}, {
    "conceptURI": null,
    "defaultValue": null,
    "description": null,
    "format": null,
    "hidden": false,
    "multiValue": false,
    "name": "int",
    "rangeURI": "xsd:int",
    "required": false,
    "shownInDetailsView": true,
    "shownInInsertView": true,
    "shownInUpdateView": true,
    "sortable": true,
    "removeFromViews": false
}, {
    "conceptURI": null,
    "defaultValue": null,
    "description": null,
    "format": null,
    "hidden": false,
    "multiValue": false,
    "name": "int-excelupload",
    "rangeURI": "xsd:int",
    "required": false,
    "shownInDetailsView": true,
    "shownInInsertView": true,
    "shownInUpdateView": true,
    "sortable": true,
    "removeFromViews": false
}, {
    "conceptURI": null,
    "defaultValue": null,
    "description": null,
    "format": null,
    "hidden": false,
    "multiValue": false,
    "name": "double",
    "rangeURI": "xsd:double",
    "required": false,
    "shownInDetailsView": true,
    "shownInInsertView": true,
    "shownInUpdateView": true,
    "sortable": true,
    "removeFromViews": false
}, {
    "conceptURI": null,
    "defaultValue": null,
    "description": null,
    "format": null,
    "hidden": false,
    "multiValue": false,
    "name": "date",
    "rangeURI": "xsd:dateTime",
    "required": false,
    "shownInDetailsView": true,
    "shownInInsertView": true,
    "shownInUpdateView": true,
    "sortable": true,
    "removeFromViews": false
}]);

describe("files actions", () => {

    test("convertRowDataIntoPreviewData - empty data object", () => {
        const rows = convertRowDataIntoPreviewData(fromJS([]), 1);
        expect(rows.size).toBe(0);
    });

    test("convertRowDataIntoPreviewData - requesting less rows then data", () => {
        const rows = convertRowDataIntoPreviewData(DATA, 1);
        expect(rows.size).toBe(1);
        expect(rows.get(0).get('str')).toBe('abc');
        expect(rows.get(0).get('int')).toBe(1);
        expect(rows.get(0).get('int-excelupload')).toBe(123.0);
        expect(rows.get(0).get('double')).toBe(1.23);
        expect(rows.get(0).get('date')).toBe('2019-01-01');
    });

    test("convertRowDataIntoPreviewData - requesting more rows then data", () => {
        const rows = convertRowDataIntoPreviewData(DATA, 4);
        expect(rows.size).toBe(3);
        expect(rows.get(0).get('str')).toBe('abc');
        expect(rows.get(1).get('int')).toBe(2);
        expect(rows.get(2).get('date')).toBe('2019-01-03');
    });

    test("convertRowDataIntoPreviewData - with fields passed in to format int column", () => {
        const rows = convertRowDataIntoPreviewData(DATA, 1, FIELDS);
        expect(rows.get(0).get('str')).toBe('abc');
        expect(rows.get(0).get('int')).toBe(1);
        expect(rows.get(0).get('int-excelupload')).toBe(123);
        expect(rows.get(0).get('double')).toBe(1.23);
        expect(rows.get(0).get('date')).toBe('2019-01-01');
    });

    test("fileMatchesAcceptedFormat - not a match", () => {
        const response = fileMatchesAcceptedFormat("testing.txt", '.csv, .tsv, .xlsx');
        expect(response.get('extension')).toBe('.txt');
        expect(response.get('isMatch')).toBeFalsy();
    });

    test("fileMatchesAcceptedFormat - matches first", () => {
        const response = fileMatchesAcceptedFormat('testing.csv', '.csv, .tsv, .xlsx');
        expect(response.get('extension')).toBe('.csv');
        expect(response.get('isMatch')).toBeTruthy();
    });

    test("fileMatchesAcceptedFormat - matches middle", () => {
        const response = fileMatchesAcceptedFormat('testing.tsv', '.csv, .tsv, .xlsx');
        expect(response.get('extension')).toBe('.tsv');
        expect(response.get('isMatch')).toBeTruthy();
    });

    test("fileMatchesAcceptedFormat - matches last", () => {
        const response = fileMatchesAcceptedFormat('testing.xlsx', '.csv, .tsv, .xlsx');
        expect(response.get('extension')).toBe('.xlsx');
        expect(response.get('isMatch')).toBeTruthy();
    });

});
