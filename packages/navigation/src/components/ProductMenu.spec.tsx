import React from 'reactn';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme'
import { List } from 'immutable';

import { ProductMenu } from './ProductMenu';
import { MenuSectionModel, ProductMenuModel } from '../model';

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
        const model = new ProductMenuModel({
            productId: "testProduct"
        });
        const tree = renderer.create(<ProductMenu model={model}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("error display", () => {
        const model = new ProductMenuModel({
            productId: "testProduct",
            isLoaded: true,
            isLoading: false,
            isError: true,
            message: "Test error message"
        });

        const tree = renderer.create(<ProductMenu model={model}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("no sections", () => {
        const productId = "testNoSections";

        const model = new ProductMenuModel(
            {
                productId: productId,
                isLoaded: true,
                isLoading: false,
                sections: List<MenuSectionModel>()
            }
        );
        const menuButton = mount(<ProductMenu model={model} />);
        expect(menuButton.find(".menu-section").length).toBe(0);
        menuButton.unmount();
    });

    test("multiple sections", () => {
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
        const model = new ProductMenuModel(
            {
                productId: productId,
                isLoaded: true,
                isLoading: false,
                sections: sections.asImmutable()
            }
        );

        const menuButton = mount(<ProductMenu model={model} />);
        expect(menuButton.find(".menu-section").length).toBe(3);
        expect(menuButton).toMatchSnapshot();
        menuButton.unmount();
    });
});