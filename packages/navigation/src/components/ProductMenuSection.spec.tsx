import React from 'reactn';
import { mount } from 'enzyme'
import { List, Map } from 'immutable';
import { MenuSectionModel, ProductMenuModel } from '../model';
import { MenuSectionConfig, ProductMenuSection } from "./ProductMenuSection";


describe("ProductMenuSection render", () => {

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

    test("empty section no text", () => {
        let section = MenuSectionModel.create({
            label: "Sample Sets",
            items: List<MenuSectionModel>(),
            itemLimit: 2,
            key: "samples",
        });

        const menuSection = mount(<ProductMenuSection productId="testProduct" section={section} config={new MenuSectionConfig()}/>);

        expect(menuSection.find('li').length).toBe(0);
        expect(menuSection).toMatchSnapshot();
    });

    test("empty section with empty text", () => {
        let section = MenuSectionModel.create({
            label: "Sample Sets",
            items: List<MenuSectionModel>(),
            key: "samples",
        });
        const menuSection = mount(<ProductMenuSection productId="testProduct" section={section} config={new MenuSectionConfig({ emptyText: "Test empty text"})}/>);

        expect(menuSection.find('li.empty-section').length).toBe(1);
        expect(menuSection.contains("Test empty text")).toBe(true);
        expect(menuSection).toMatchSnapshot();
    });


    test("one-column section", () => {
        const productId = "testProduct3Columns";

        let section = MenuSectionModel.create({
            label: "Sample Sets",
            url: undefined,
            items: sampleSetItems,
            itemLimit: 2,
            key: "samples"
        });

        const menuSection = mount(<ProductMenuSection productId={productId} section={section} config={new MenuSectionConfig()} />);
        expect(menuSection.find('ul').length).toBe(1);
        expect(menuSection).toMatchSnapshot();
        menuSection.unmount();
    });

    test("two-column section", () => {
        const productId = "testProduct4Columns";

        const section = MenuSectionModel.create({
            label: "Assays",
            items: assayItems,
            key: "assays"
        });

        const sectionConfig = new MenuSectionConfig({
            maxColumns: 2,
            maxItemsPerColumn: 2
        });

        const menuSection = mount(<ProductMenuSection section={section} productId={productId} config={sectionConfig}/>);

        expect(menuSection.find('ul').length).toBe(2);
        expect(menuSection).toMatchSnapshot();
        menuSection.unmount();
    });

    test("two columns with overflow link", () => {
        const productId = "testProductOverflowLink";
        let sections = List<MenuSectionModel>().asMutable();

        const section = new MenuSectionModel({
            label: "Assays",
            items: assayItems,
            key: "assays",
            totalCount: 5
        });

        const model = new ProductMenuModel(
            {   productId,
                isLoaded: true,
                isLoading: false,
                sections: sections.asImmutable()
            }
        );
        let sectionConfigs = Map<string, MenuSectionConfig>().asMutable();
        const sectionConfig = new MenuSectionConfig({
            maxColumns: 2,
            maxItemsPerColumn: 2
        });

        const menuSection = mount(<ProductMenuSection section={section} productId={productId} config={sectionConfig}/>);
        expect(menuSection.find('ul').length).toBe(2);
        expect(menuSection.find('span.overflow-link').length).toBe(1);
        expect(menuSection).toMatchSnapshot();
        menuSection.unmount();
    })
});