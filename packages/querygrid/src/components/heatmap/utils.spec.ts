import { AppURL } from "@glass/base";

import { addDateRangeFilter, monthSort } from "./utils";

describe("HeatMap utils", () => {

    test("addDateRangeFilter", () => {
        const url = AppURL.create([]);
        const url2 = addDateRangeFilter(url, 'col', new Date('2020-01-01'), new Date('2020-01-02'));
        expect(url2.toString()).toBe('/?query.col~dategte=2020-01-01&query.col~datelte=2020-01-02');
    });

    test("monthSort", () => {
        expect(monthSort('Jan', 'Feb')).toBe(-1);
        expect(monthSort('Feb', 'Jan')).toBe(1);
        expect(monthSort('Feb', 'Feb')).toBe(0);

        expect(monthSort('test', 'Feb')).toBe(-1);
        expect(monthSort('Feb', 'test')).toBe(1);
        expect(monthSort('test', 'test')).toBe(0);
        expect(monthSort('jan', 'feb')).toBe(0);
    });

});