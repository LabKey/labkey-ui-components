import { QueryGridModel } from './model'

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