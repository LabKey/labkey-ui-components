import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { makeQueryInfo } from '../../internal/test/testHelpers';

import mixturesQueryInfo from '../../test/data/mixtures-getQueryDetails.json';

import { SchemaQuery } from '../SchemaQuery';

import { QueryInfo } from '../QueryInfo';

import { ViewMenu } from './ViewMenu';
import { makeTestQueryModel } from './testUtils';

const SCHEMA_QUERY = new SchemaQuery('exp.data', 'mixtures');
let QUERY_INFO_NO_VIEWS: QueryInfo;
let QUERY_INFO_PUBLIC_VIEWS: QueryInfo;
let QUERY_INFO_PRIVATE_VIEWS: QueryInfo;
let QUERY_INFO_HIDDEN_VIEWS: QueryInfo;

beforeAll(() => {
    // Have to instantiate QueryInfos here because applyQueryMetadata relies on initQueryGridState being called first.
    QUERY_INFO_NO_VIEWS = makeQueryInfo({
        ...mixturesQueryInfo,
        views: [],
    });
    QUERY_INFO_PUBLIC_VIEWS = makeQueryInfo(mixturesQueryInfo);
    QUERY_INFO_PRIVATE_VIEWS = makeQueryInfo({
        ...mixturesQueryInfo,
        views: [
            mixturesQueryInfo.views[0],
            {
                ...mixturesQueryInfo.views[1],
                shared: false,
            },
        ],
    });
    QUERY_INFO_HIDDEN_VIEWS = makeQueryInfo({
        ...mixturesQueryInfo,
        views: [
            mixturesQueryInfo.views[0],
            {
                ...mixturesQueryInfo.views[1],
                hidden: true,
            },
        ],
    });
});

const DEFAULT_PROPS = {
    allowViewCustomization: false,
    onViewSelect: jest.fn(),
    onSaveView: jest.fn(),
    onManageViews: jest.fn(),
    onCustomizeView: jest.fn(),
};

describe('ViewMenu', () => {
    test('Render', () => {
        // Renders nothing
        let model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_NO_VIEWS, {}, []);
        let { container, unmount } = render(<ViewMenu {...DEFAULT_PROPS} hideEmptyViewMenu={true} model={model} />);
        expect(container.querySelectorAll('.lk-menu-item')).toHaveLength(0);
        unmount();

        // Renders empty view selector with disabled dropdown.
        ({ container, unmount } = render(<ViewMenu {...DEFAULT_PROPS} hideEmptyViewMenu={false} model={model} />));
        expect(container.querySelectorAll('.lk-menu-item')).toHaveLength(0);
        unmount();

        // "No Extra Column" view shows up under "Shared Saved Views"
        model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_PUBLIC_VIEWS, {}, []);
        ({ container, unmount } = render(<ViewMenu {...DEFAULT_PROPS} hideEmptyViewMenu={true} model={model} />));
        expect(container.querySelector('.lk-dropdown-header').textContent).toBe('Shared Saved Views');
        let items = container.querySelectorAll('.lk-menu-item');
        expect(items).toHaveLength(3);
        expect(items[1].textContent.trim()).toBe('No Extra Column');
        unmount();

        // "No Extra Column" view shows up under "My Saved Views"
        model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_PRIVATE_VIEWS, {}, []);
        ({ container, unmount } = render(<ViewMenu {...DEFAULT_PROPS} hideEmptyViewMenu={true} model={model} />));
        expect(container.querySelector('.lk-dropdown-header').textContent).toBe('Your Saved Views');
        items = container.querySelectorAll('.lk-menu-item');
        expect(items[1].textContent.trim()).toBe('No Extra Column');
        unmount();

        // Same as previous, but the No Extra Column view is set to active.
        model = model.mutate({
            schemaQuery: new SchemaQuery(SCHEMA_QUERY.schemaName, SCHEMA_QUERY.queryName, 'noExtraColumn'),
        });
        ({ container, unmount } = render(<ViewMenu {...DEFAULT_PROPS} hideEmptyViewMenu={true} model={model} />));
        expect(container.querySelector('.lk-dropdown-header').textContent).toBe('Your Saved Views');
        items = container.querySelectorAll('.lk-menu-item');
        expect(items[1].textContent.trim()).toBe('No Extra Column');
        expect(items[1].classList.contains('active')).toBe(true);
        unmount();

        // "No Extra Column" view is hidden so does not show up
        model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_HIDDEN_VIEWS, {}, []);
        ({ container, unmount } = render(<ViewMenu {...DEFAULT_PROPS} hideEmptyViewMenu={false} model={model} />));
        items = container.querySelectorAll('.lk-menu-item');
        expect(items).toHaveLength(1);
        expect(items[0].textContent.trim()).toBe('Default');
        unmount();
    });

    test('Customized view menus', () => {
        LABKEY.user = {
            isGuest: false,
        };
        const model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_HIDDEN_VIEWS, {}, []);
        const { container } = render(
            <ViewMenu {...DEFAULT_PROPS} allowViewCustomization={true} hideEmptyViewMenu={false} model={model} />
        );
        const items = container.querySelectorAll('.lk-menu-item');
        expect(items).toHaveLength(4);
        expect(items[1].textContent.trim()).toBe('Customize Grid View');
        expect(items[2].textContent.trim()).toBe('Manage Saved Views');
        expect(items[3].textContent.trim()).toBe('Save Grid View');
    });

    test('Customized view menus, guest user', () => {
        LABKEY.user = {
            isGuest: true,
        };
        const model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_HIDDEN_VIEWS, {}, []);
        const { container } = render(<ViewMenu {...DEFAULT_PROPS} hideEmptyViewMenu={false} model={model} />);
        const items = container.querySelectorAll('.lk-menu-item');
        expect(items).toHaveLength(1);
    });

    test('No views but customize enabled', () => {
        LABKEY.user = {
            isGuest: false,
        };

        const model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_NO_VIEWS, {}, []);
        const { container } = render(
            <ViewMenu {...DEFAULT_PROPS} allowViewCustomization={true} hideEmptyViewMenu={false} model={model} />
        );
        const items = container.querySelectorAll('.lk-menu-item');
        expect(items).toHaveLength(3);
        expect(items[0].textContent.trim()).toBe('Customize Grid View');
        expect(items[1].textContent.trim()).toBe('Manage Saved Views');
        expect(items[2].textContent.trim()).toBe('Save Grid View');
    });

    test('Interactivity', () => {
        const onViewSelect = jest.fn();
        const model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_PUBLIC_VIEWS, {}, []);
        const { container } = render(
            <ViewMenu
                allowViewCustomization={false}
                hideEmptyViewMenu={true}
                model={model}
                onViewSelect={onViewSelect}
                onSaveView={jest.fn()}
                onManageViews={jest.fn()}
            />
        );
        const items = container.querySelectorAll('.lk-menu-item');
        fireEvent.click(items[items.length - 1].querySelector('a'));
        expect(onViewSelect).toHaveBeenCalledWith('noMixtures');
    });
});
