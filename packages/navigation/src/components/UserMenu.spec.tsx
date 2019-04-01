import React from 'reactn';
import { List } from 'immutable';
import renderer from 'react-test-renderer';
import { User } from '@glass/models';
import { UserMenu } from './UserMenu';
import { MenuSectionModel, ProductMenuModel } from '../model';

beforeAll(() => {
    LABKEY.devMode = false;
});

describe("UserMenu", () => {

    let sections = List<MenuSectionModel>().asMutable();
    sections.push( MenuSectionModel.create({
        key: "user",
        label: "Your Items",
        url: undefined,
        items: [
            {
                key: "profile",
                label: "Profile",
                url: "profile/link/here",
                requiresLogin: true
            },
            {
                key: "docs",
                label: "Documentation",
                url: "http://show/me/the/docs",
                requiresLogin: false
            }
        ]
    }));

    test("not initialized", () => {
        const model = new ProductMenuModel({
            productId: "testProduct"
        });
        const tree = renderer.create(<UserMenu model={model} user={new User()}/>).toJSON();
        expect(tree).toBe(null);
    });

    test("user not logged in", () => {
        const productId = "notLoggedInUser";
        const user = new User( {
            isSignedIn: false
        });

        const model = new ProductMenuModel(
            {
                isLoaded: true,
                isLoading: false,
                productId,
                sections: sections.asImmutable()
            }
        );
        const tree = renderer.create(<UserMenu model={model} user={user}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("user logged in, but not in dev mode", () => {
        const productId = "loggedInUser";
        const user = new User( {
            isSignedIn: true
        });

        const model = new ProductMenuModel(
            {
                isLoaded: true,
                isLoading: false,
                productId,
                sections: sections.asImmutable()
            }
        );
        const tree = renderer.create(<UserMenu model={model} user={user}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("user logged in dev mode", () => {
        const productId = "logginedInDevMode";
        const user = new User( {
            isSignedIn: true
        });
        LABKEY.devMode = true;
        const model = new ProductMenuModel(
            {
                isLoaded: true,
                isLoading: false,
                productId,
                sections: sections.asImmutable()
            }
        );
        const tree = renderer.create(<UserMenu model={model} user={user}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("user logged in extra items", () => {
        const productId = "extraUserItems";
        const user = new User( {
            isSignedIn: true
        });

        const model = new ProductMenuModel(
            {
                isLoaded: true,
                isLoading: false,
                productId,
                sections: sections.asImmutable()
            }
        );
        let extraUserItems = [
            <div key="e1">Extra One</div>,
            <div key="e2">Extra Two</div>
        ];
        const tree = renderer.create(<UserMenu model={model} user={user} extraUserItems={extraUserItems}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("user logged in extra dev mode items", () => {
        const productId = "extraDevItems";
        const user = new User( {
            isSignedIn: true
        });

        const model = new ProductMenuModel(

            {
                isLoaded: true,
                isLoading: false,
                productId,
                sections: sections.asImmutable()
            }
        );
        let extraUserItems = [
            <div key="e1">Extra One</div>,
            <div key="e2">Extra Two</div>
        ];
        let extraDevItems = [
            <div key="e1">Extra Dev One</div>,
            <div key="e2">Extra Dev Two</div>
        ];
        const tree = renderer.create(<UserMenu model={model} user={user} extraUserItems={extraUserItems} extraDevItems={extraDevItems}/>).toJSON();
        expect(tree).toMatchSnapshot();
    })
});