import * as React from 'react';
import renderer from 'react-test-renderer';
import { Page } from "./Page";
import { shallow } from "enzyme";
import { NotFound } from "./NotFound";
import { PageHeader } from "./PageHeader";

describe("<Page /> document title", () => {
   test("empty properties", () => {
       expect(Page.getDocumentTitle({})).toBe('');
   });

   test("empty title, no product name", () => {
       expect(Page.getDocumentTitle({title: ''})).toBe('');
   });

   test ("empty product name, no title", () => {
       expect(Page.getDocumentTitle({productName: ''})).toBe('');
   });

   test('title but no product name', () => {
       expect(Page.getDocumentTitle({title: "Page title"})).toBe("Page title");
   });

   test('title with empty product name', () => {
       expect(Page.getDocumentTitle({title: "Page title", productName: ''})).toBe("Page title");
   });

    test("product name but no title", () => {
        expect(Page.getDocumentTitle({productName: "Product Alpha"})).toBe("Product Alpha")
    });

    test("product name with empty title", () => {
        expect(Page.getDocumentTitle({productName: "Product Alpha", title: ''})).toBe("Product Alpha");
    });

    test("product name and title", () => {
        expect(Page.getDocumentTitle({productName: "Product Alpha", title: "Page title"})).toBe("Page title - Product Alpha");
    });
});

describe("<Page />", () => {
   test("page not found", () => {
       const wrapper = shallow(<Page notFound={true}/>);
       expect(wrapper.find(NotFound)).toHaveLength(1);

       const tree = renderer.create(<Page notFound={true}/>).toJSON();
       expect(tree).toMatchSnapshot();
   });

   test("hasHeader", () => {
       const wrapper = shallow(<Page hasHeader={true}>Page contents</Page>);
       expect(wrapper.find(PageHeader)).toHaveLength(0);
   });

   test("header as child but no hasHeader property", () => {
       const wrapper = shallow(<Page><PageHeader>Header</PageHeader></Page>);
       expect(wrapper.find(PageHeader)).toHaveLength(1); // make sure we don't have two headers
   });

   test("render with children and no header", () => {
       const wrapper = shallow(<Page><div>The page contents</div></Page>);
       // should add in a page header
       expect(wrapper.find(PageHeader)).toHaveLength(1);

       const tree = renderer.create(<Page><div>The page contents</div></Page>);
       expect(tree).toMatchSnapshot();
   })
});