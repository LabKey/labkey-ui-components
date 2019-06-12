import { fromJS } from 'immutable'
import {convertRowDataIntoPreviewData} from "./actions";

const DATA = fromJS([
    ['col1', 'col2', 'col3'],
    ['abc', 123, '2019-01-01'],
    ['def', 456, '2019-01-02'],
    ['ghi', 789, '2019-01-03']
]);

describe("files actions", () => {

    test("convertRowDataIntoPreviewData - empty data object", () => {
        const rows = convertRowDataIntoPreviewData(fromJS([]), 1);
        expect(rows.size).toBe(0);
    });

    test("convertRowDataIntoPreviewData - requesting less rows then data", () => {
        const rows = convertRowDataIntoPreviewData(DATA, 1);
        expect(rows.size).toBe(1);
        expect(rows.get(0).get('col1')).toBe('abc');
        expect(rows.get(0).get('col2')).toBe(123);
        expect(rows.get(0).get('col3')).toBe('2019-01-01');
    });

    test("convertRowDataIntoPreviewData - requesting more rows then data", () => {
        const rows = convertRowDataIntoPreviewData(DATA, 4);
        expect(rows.size).toBe(3);
        expect(rows.get(0).get('col1')).toBe('abc');
        expect(rows.get(1).get('col2')).toBe(456);
        expect(rows.get(2).get('col3')).toBe('2019-01-03');
    });

});