import React from 'reactn';
import renderer from 'react-test-renderer';
import { mount, shallow } from 'enzyme'
import { List, Map } from 'immutable';

import { MenuSectionConfig, ProductMenu } from './ProductMenu';
import { initNavigationState, updateProductMenuModel } from '../global';
import { MenuSectionModel } from '../model';

beforeAll(() => {
    initNavigationState()
});


describe("ProductMenu render", () => {

    const sampleSetItems = List<MenuSectionModel>([
        {
            id: 1,
            label: "Sample Set 1",
        },
        {
            id: 2,
            label: "Sample Set 2",
        },
        {
            id: 3,
            label: "Sample Set 3",
        },
        {
            id: 4,
            label: "Sample Set 4",
        }
    ]);

    const assayItems = List<MenuSectionModel>([
        {
            id: 11,
            label: "Assay 1",
        },
        {
            id: 12,
            label: "Assay 2",
        },
        {
            id: 13,
            label: "Assay 3",
        },
        {
            id: 14,
            label: "Assay 4",
        },
        {
            id: 15,
            label: "Assay 5"
        }
    ]);

    const yourItems  = List<MenuSectionModel>([
        {
            id: 21,
            label: "Documentation"
        }
    ]);

    const yourItemsSection =  MenuSectionModel.create({
        label: "Your Items",
        items: yourItems,
        key: 'user'
    });

    test("loading", () => {
        const tree = renderer.create(<ProductMenu productId={"testProduct"}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("error display", () => {
        updateProductMenuModel(
            "testProduct",
            {isLoaded: true, isLoading: false, isError: true, message: "Test error message"},
            false);
        const tree = renderer.create(<ProductMenu productId={"testProduct"}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("one column per section", () => {
        const productId = "testProduct3Columns";

        let sections = List<MenuSectionModel>().asMutable();
        sections.push( MenuSectionModel.create({
            label: "Sample Sets",
            url: undefined,
            items: sampleSetItems,
            itemLimit: 2,
            key: "samples"
        }));
        sections.push( MenuSectionModel.create({
            label: "Assays",
            items: assayItems,
            key: "assays"
        }));
        sections.push(yourItemsSection);
        updateProductMenuModel(
            productId,
            {
                isLoaded: true,
                isLoading: false,
                sections: sections.asImmutable()
            },
            false
        );

        const menuButton = mount(<ProductMenu productId={productId} />);
        expect(menuButton.find('div.col-3').length).toBe(1);
        expect(menuButton).toMatchSnapshot();
        menuButton.unmount();
    });

    test("two columns for assays", () => {
        const productId = "testProduct4Columns";
        let sections = List<MenuSectionModel>().asMutable();
        sections.push( MenuSectionModel.create({
            label: "Sample Sets",
            url: undefined,
            items: sampleSetItems.slice(0, 2),
            itemLimit: 2,
            key: "samples"
        }));
        sections.push( MenuSectionModel.create({
            label: "Assays",
            items: assayItems,
            key: "assays"
        }));
        sections.push(yourItemsSection);
        updateProductMenuModel(
            productId,
            {
                isLoaded: true,
                isLoading: false,
                sections: sections.asImmutable()
            },
            false
        );
        let sectionConfigs = Map<string, MenuSectionConfig>().asMutable();
        sectionConfigs.set("assays", new MenuSectionConfig({
            maxColumns: 2,
            maxItemsPerColumn: 2
        }));

        const menuButton = mount(<ProductMenu productId={productId} sectionConfigs={sectionConfigs.asImmutable()}/>);

        expect(menuButton.find('div.col-4').length).toBe(1);
        expect(menuButton).toMatchSnapshot();
        menuButton.unmount();
    });

    test("two columns for assays and samples", () => {
        const productId = "testProduct4Columns";
        let sections = List<MenuSectionModel>().asMutable();
        sections.push( new MenuSectionModel({
            label: "Sample Sets",
            url: undefined,
            items: sampleSetItems,
            key: "samples"
        }));
        sections.push( new MenuSectionModel({
            label: "Assays",
            items: assayItems,
            key: "assays"
        }));
        sections.push(yourItemsSection);
        updateProductMenuModel(
            productId,
            {
                isLoaded: true,
                isLoading: false,
                sections: sections.asImmutable()
            },
            false
        );

        let sectionConfigs = Map<string, MenuSectionConfig>().asMutable();
        sectionConfigs.set("assays", new MenuSectionConfig({
            maxColumns: 2,
            maxItemsPerColumn: 2
        }));
        sectionConfigs.set("samples", new MenuSectionConfig({
            maxColumns: 2,
            maxItemsPerColumn: 2
        }));

        const menuButton = mount(<ProductMenu productId={productId} sectionConfigs={sectionConfigs}/>);
        expect(menuButton.find('div.col-5').length).toBe(1);
        expect(menuButton).toMatchSnapshot();
        menuButton.unmount();
    });

    test("two columns with overflow link", () => {
        const productId = "testProductOverflowLink";
        let sections = List<MenuSectionModel>().asMutable();
        sections.push( new MenuSectionModel({
            label: "Sample Sets",
            url: undefined,
            items: sampleSetItems,
            key: "samples",
            totalCount: 4
        }));
        sections.push( new MenuSectionModel({
            label: "Assays",
            items: assayItems,
            key: "assays",
            totalCount: 5
        }));
        sections.push(yourItemsSection);
        updateProductMenuModel(
            productId,
            {
                isLoaded: true,
                isLoading: false,
                sections: sections.asImmutable()
            },
            false
        );
        let sectionConfigs = Map<string, MenuSectionConfig>().asMutable();
        sectionConfigs.set("assays", new MenuSectionConfig({
            maxColumns: 2,
            maxItemsPerColumn: 2
        }));
        sectionConfigs.set("samples", new MenuSectionConfig({
            maxColumns: 2,
            maxItemsPerColumn: 2
        }));

        const menuButton = mount(<ProductMenu productId={productId} sectionConfigs={sectionConfigs}/>);
        expect(menuButton.find('div.col-5').length).toBe(1);
        expect(menuButton).toMatchSnapshot();
        menuButton.unmount();
    })
});