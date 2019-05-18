import { AssayDefinitionModel, QueryGridModel, SchemaQuery } from './model'

import assayDefJSON from '../test/data/assayDefinitionModel.json';
import assayDefNoSampleIdJSON from '../test/data/assayDefinitionModelNoSampleId.json';

describe("QueryGridModel", () => {

   test("createParam no prefix", () => {
        const model = new QueryGridModel();
        expect(model.createParam("param")).toEqual("param");
        expect(model.createParam("param", "default")).toEqual("default.param");
   });

   test("createParam with prefix", () => {
       const model = new QueryGridModel({
           urlPrefix: "test"
       });
       expect(model.createParam('param')).toEqual("test.param");
       expect(model.createParam("param", "default")).toEqual("test.param");
   });

});

describe("AssayDefinitionModel", () => {

   test("getSampleColumn()", () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const sampleColumn = modelWithSampleId.getSampleColumn();
        expect(sampleColumn).toBeTruthy();
        expect(sampleColumn.domain).toBe('Result');
        expect(sampleColumn.column.isLookup()).toBeTruthy();
        expect(sampleColumn.column.fieldKey).toBe('SampleID');

        const modelWithout = AssayDefinitionModel.create(assayDefNoSampleIdJSON);
        const nonSampleColumn = modelWithout.getSampleColumn();
        expect(nonSampleColumn).toBe(null);
   });

   test("getSampleColumnLookup()", () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const sampleColumn = modelWithSampleId.getSampleColumnLookup();
        expect(sampleColumn).toBe('SampleID');

        const modelWithout = AssayDefinitionModel.create(assayDefNoSampleIdJSON);
        const nonSampleColumn = modelWithout.getSampleColumnLookup();
        expect(nonSampleColumn).toBe(null);
   });

   test("hasLookup()", () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        expect(modelWithSampleId.hasLookup(SchemaQuery.create('samples', 'Samples'))).toBeTruthy();
        expect(modelWithSampleId.hasLookup(SchemaQuery.create('study', 'Study'))).toBeTruthy();
        expect(modelWithSampleId.hasLookup(SchemaQuery.create('study', 'Other'))).toBeFalsy();
   });

});