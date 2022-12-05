import React from 'react';
import { ReactWrapper } from 'enzyme';
import { Button } from 'react-bootstrap';

import { mountWithAppServerContext } from '../internal/testHelpers';

import { AssayListingPage } from './AssayListingPage';
import { InsufficientPermissionsPage } from '../internal/components/permissions/InsufficientPermissionsPage';
import {LoadingPage} from "../internal/components/base/LoadingPage";
import {Page} from "../internal/components/base/Page";
import { Section } from '../internal/components/base/Section';
import {AssayTypeSummary} from "./AssayTypeSummary";
import {AssayDesignEmptyAlert} from "../internal/components/assay/AssayDesignEmptyAlert";
import {MenuSectionModel, ProductMenuModel} from "../internal/components/navigation/model";
import {List} from "immutable";
import {ASSAYS_KEY} from "../internal/app/constants";
import {TEST_USER_APP_ADMIN, TEST_USER_READER} from "../internal/userFixtures";
import {AssayAppContext} from "../internal/AppContext";

describe('AssayListingPage', () => {
    const MENU_HAS_ITEMS = new ProductMenuModel({
        isLoaded: true,
        isLoading: false,
        sections: List<MenuSectionModel>([
            MenuSectionModel.create({
                label: 'Assays',
                url: undefined,
                items: List<MenuSectionModel>([
                    {
                        id: 1,
                        label: 'GPAT 1',
                    },
                ]),
                itemLimit: 2,
                key: ASSAYS_KEY,
                totalCount: 1,
            }),
        ]),
    });
    const MENU_NO_ITEMS = new ProductMenuModel({
        isLoaded: true,
        isLoading: false,
        sections: List<MenuSectionModel>([
            MenuSectionModel.create({
                label: 'Assays',
                url: undefined,
                items: List<MenuSectionModel>([]),
                itemLimit: 2,
                key: ASSAYS_KEY,
                totalCount: 0,
            }),
        ]),
    });

    function validate(wrapper: ReactWrapper, hasReadPerm = true, hasItems = true) {
        expect(wrapper.find(InsufficientPermissionsPage)).toHaveLength(hasReadPerm ? 0 : 1);
        expect(wrapper.find(LoadingPage)).toHaveLength(0);
        expect(wrapper.find(Page)).toHaveLength(hasReadPerm ? 1 : 0);
        expect(wrapper.find(Section)).toHaveLength(hasReadPerm ? 1 : 0);
        expect(wrapper.find(AssayTypeSummary)).toHaveLength(hasReadPerm && hasItems ? 1 : 0);
        expect(wrapper.find(AssayDesignEmptyAlert)).toHaveLength(hasReadPerm && !hasItems ? 1 : 0);
    }

    test('has items, admin', () => {
        const wrapper = mountWithAppServerContext(
            <AssayListingPage menu={MENU_HAS_ITEMS} />,
            { assay: {} as AssayAppContext },
            { user: TEST_USER_APP_ADMIN }
        );

        validate(wrapper);
        expect(wrapper.find(Button)).toHaveLength(3);
        expect(wrapper.find(Button).first().prop('href')).toBe('#/assayDesign/new');
    });

    test('has items, admin, with assayTypes', () => {
        const wrapper = mountWithAppServerContext(
            <AssayListingPage menu={MENU_HAS_ITEMS} />,
            { assay: { assayTypes: ['standard'] } as AssayAppContext },
            { user: TEST_USER_APP_ADMIN }
        );

        validate(wrapper);
        expect(wrapper.find(Button)).toHaveLength(3);
        expect(wrapper.find(Button).first().prop('href')).toBe('#/assayDesign/General');
    });

    test('has items, reader', () => {
        const wrapper = mountWithAppServerContext(
            <AssayListingPage menu={MENU_HAS_ITEMS} />,
            { assay: {} as AssayAppContext },
            { user: TEST_USER_READER }
        );

        validate(wrapper);
        expect(wrapper.find(Button)).toHaveLength(2);
    });

    test('no items, admin', () => {
        const wrapper = mountWithAppServerContext(
            <AssayListingPage menu={MENU_NO_ITEMS} />,
            { assay: {} as AssayAppContext },
            { user: TEST_USER_APP_ADMIN }
        );

        validate(wrapper, true, false);
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(wrapper.find(Button).first().prop('href')).toBe('#/assayDesign/new');
    });

    test('no items, reader', () => {
        const wrapper = mountWithAppServerContext(
            <AssayListingPage menu={MENU_NO_ITEMS} />,
            { assay: {} as AssayAppContext },
            { user: TEST_USER_READER }
        );

        validate(wrapper, true, false);
        expect(wrapper.find(Button)).toHaveLength(0);
    });
});
