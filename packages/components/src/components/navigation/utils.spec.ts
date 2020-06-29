import { createApplicationUrlFromParts } from './utils';

describe("createApplicationUrlFromParts", () => {

    test("no productId", () => {
        const url = createApplicationUrlFromParts(undefined, "currentProduct", undefined, "destination");
        expect(url.toString()).toEqual("/destination");
    });

    test("no currentProductId", () => {
        const url = createApplicationUrlFromParts("urlProduct", undefined, {rowId: 123}, "destination");
        expect(url).toEqual("/labkey/urlproduct/app.view#/destination?rowId=123");
    });

    test("not currentProductId", () => {
        const url = createApplicationUrlFromParts("urlProduct", "currentProduct", {rowId: 123}, "destination");
        expect(url).toEqual("/labkey/urlproduct/app.view#/destination?rowId=123");
    });

    test("is current product", () => {
        const url = createApplicationUrlFromParts("currentProduct", "currentProduct", {rowId: 123}, "destination");
        expect(url.toString()).toEqual("/destination?rowId=123");
    });

    test("with multiple params", () => {
        const url = createApplicationUrlFromParts(undefined, "currentProduct", {rowId: 123, view: "grid"}, "destination");
        expect(url.toString()).toEqual("/destination?rowId=123&view=grid");
    });

    test("with multiple parts", () => {
        const url = createApplicationUrlFromParts(undefined, "currentProduct", {rowId: 42}, "destination", "mars");
        expect(url.toString()).toEqual("/destination/mars?rowId=42");
    });
})
