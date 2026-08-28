/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { render } from '@testing-library/react';

import { userEvent } from '@testing-library/user-event';

import { ViewInfo } from '../../internal/ViewInfo';

import { QuerySort } from '../QuerySort';

import {
    TEST_USER_APP_ADMIN,
    TEST_USER_EDITOR,
    TEST_USER_PROJECT_ADMIN,
    TEST_USER_READER,
} from '../../internal/userFixtures';

import { renderWithAppContext } from '../../internal/test/reactTestLibraryHelpers';

import { FilterAction } from './grid/actions/Filter';
import { SortAction } from './grid/actions/Sort';

import { SaveViewModal, ViewNameInput } from './SaveViewModal';

describe('SaveViewModal', () => {
    const DEFAULT_PROPS = {
        gridLabel: 'Blood Samples',
        onCancel: jest.fn(),
        onConfirmSave: jest.fn(),
    };

    const DEFAULT_VIEW = ViewInfo.fromJson({
        default: true,
        inherit: true,
    });

    const VIEW_1 = ViewInfo.fromJson({
        label: 'View 1',
        name: 'View1',
        inherit: false,
    });

    const VIEW_2 = ViewInfo.fromJson({
        label: 'View 2',
        name: 'View2',
        inherit: true,
    });

    const SESSION_VIEW_SHADOWING_INHERITED = ViewInfo.fromJson({
        default: true,
        inherit: false,
        session: true,
        shadowed: { default: true, inherit: true },
    });

    const SESSION_VIEW_SHADOWING_LOCAL = ViewInfo.fromJson({
        default: true,
        inherit: false,
        session: true,
        shadowed: { default: true, inherit: false },
    });

    const SESSION_VIEW_SHADOWING_SHARED = ViewInfo.fromJson({
        label: 'View 1',
        name: 'View1',
        session: true,
        shared: false,
        shadowed: { name: 'View1', shared: true },
    });

    const SESSION_VIEW_SHADOWING_PRIVATE = ViewInfo.fromJson({
        label: 'View 1',
        name: 'View1',
        session: true,
        shared: false,
        shadowed: { name: 'View1', shared: false },
    });

    const moduleContext = {
        query: {
            isProductFoldersEnabled: true,
        },
    };

    test('current view is default', () => {
        renderWithAppContext(<SaveViewModal {...DEFAULT_PROPS} currentView={DEFAULT_VIEW} />, {
            serverContext: {
                user: TEST_USER_APP_ADMIN,
                container: {
                    path: '/home',
                    type: 'project',
                },
                moduleContext,
            },
        });

        expect(document.querySelector('.modal-title').textContent).toBe('Save Grid View');
        expect(document.querySelector('.modal-body').textContent).toContain(
            'Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(document.querySelectorAll('input[name="gridViewName"]')).toHaveLength(0);
        expect(document.querySelector('input[id="defaultView"]').hasAttribute('checked')).toBeTruthy();
        expect(document.querySelector('input[id="customView"]').hasAttribute('checked')).toBeFalsy();
        expect(document.querySelector('input[name="setInherit"]').hasAttribute('checked')).toBe(true);
        expect(document.querySelectorAll('input[name="setShared"]')).toHaveLength(0);
    });

    test('current view is a customized view', () => {
        renderWithAppContext(<SaveViewModal {...DEFAULT_PROPS} currentView={VIEW_1} />, {
            serverContext: {
                user: TEST_USER_PROJECT_ADMIN,
                container: {
                    path: '/home',
                    type: 'project',
                },
                moduleContext,
            },
        });

        expect(document.querySelector('.modal-title').textContent).toBe('Save Grid View');
        expect(document.querySelector('.modal-body').textContent).toContain(
            'Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(document.querySelector('input[name="gridViewName"]').getAttribute('value')).toBe('View1');
        expect(document.querySelector('input[id="defaultView"]').hasAttribute('checked')).toBeFalsy();
        expect(document.querySelector('input[id="customView"]').hasAttribute('checked')).toBeTruthy();
        expect(document.querySelector('input[name="setInherit"]').hasAttribute('checked')).toBe(false);
        expect(document.querySelector('input[name="setShared"]').hasAttribute('checked')).toBe(false);
    });

    test('customized view in subfolder', () => {
        renderWithAppContext(<SaveViewModal {...DEFAULT_PROPS} currentView={VIEW_1} />, {
            serverContext: {
                user: TEST_USER_PROJECT_ADMIN,
                container: {
                    path: '/home/folderA',
                    type: 'folder',
                },
                moduleContext,
            },
        });

        expect(document.querySelector('.modal-title').textContent).toBe('Save Grid View');
        expect(document.querySelector('.modal-body').textContent).toContain(
            'Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(document.querySelector('input[name="gridViewName"]').getAttribute('value')).toBe('View1');
        expect(document.querySelector('input[id="defaultView"]').hasAttribute('checked')).toBeFalsy();
        expect(document.querySelector('input[id="customView"]').hasAttribute('checked')).toBeTruthy();
        expect(document.querySelectorAll('input[name="setInherit"]')).toHaveLength(0);
        expect(document.querySelector('input[name="setShared"]').hasAttribute('checked')).toBe(false);
    });

    test('no admin perm, but shared view perm', () => {
        renderWithAppContext(<SaveViewModal {...DEFAULT_PROPS} currentView={VIEW_2} />, {
            serverContext: {
                user: TEST_USER_EDITOR,
                container: {
                    path: '/home',
                    type: 'project',
                },
                moduleContext,
            },
        });

        expect(document.querySelector('.modal-title').textContent).toBe('Save Grid View');
        expect(document.querySelector('.modal-body').textContent).toContain(
            'Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(document.querySelector('input[name="gridViewName"]').getAttribute('value')).toBe('View2');
        expect(document.querySelectorAll('input[name="setDefaultView"]').length).toEqual(0);
        expect(document.querySelector('input[name="setInherit"]').hasAttribute('checked')).toBe(true);
        expect(document.querySelector('input[name="setShared"]').hasAttribute('checked')).toBe(false);
    });

    test('no shared view perm', () => {
        renderWithAppContext(<SaveViewModal {...DEFAULT_PROPS} currentView={VIEW_2} />, {
            serverContext: {
                user: TEST_USER_READER,
                container: {
                    path: '/home',
                    type: 'project',
                },
                moduleContext,
            },
        });

        expect(document.querySelector('.modal-title').textContent).toBe('Save Grid View');
        expect(document.querySelector('.modal-body').textContent).toContain(
            'Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(document.querySelector('input[name="gridViewName"]').getAttribute('value')).toBe('View2');
        expect(document.querySelectorAll('input[name="setDefaultView"]')).toHaveLength(0);
        expect(document.querySelectorAll('input[name="setInherit"]')).toHaveLength(0);
        expect(document.querySelectorAll('input[name="setShared"]')).toHaveLength(0);
    });

    test('no filters or sorts', () => {
        renderWithAppContext(<SaveViewModal {...DEFAULT_PROPS} currentView={VIEW_1} />, {
            serverContext: { user: TEST_USER_EDITOR, moduleContext },
        });

        const sections = document.querySelectorAll('.save-view-modal__action-values');
        expect(sections).toHaveLength(2);
        expect(sections[0].textContent).toBe('Filters included in viewNo filters applied');
        expect(sections[1].textContent).toBe('Sort order for this viewNo sort applied');
        expect(document.querySelectorAll('.filter-status-value')).toHaveLength(0);
    });

    test('filters and sorts to be saved', () => {
        renderWithAppContext(
            <SaveViewModal
                {...DEFAULT_PROPS}
                currentView={VIEW_1}
                filterActionValues={[
                    {
                        action: new FilterAction('query'),
                        displayValue: 'Status = Available',
                        isRemovable: false,
                        value: 'Status = Available',
                    },
                ]}
                sortActionValues={[
                    {
                        action: new SortAction(),
                        displayValue: 'Sample ID',
                        isRemovable: false,
                        value: 'SampleID ASC',
                        valueObject: new QuerySort({ fieldKey: 'SampleID' }),
                    },
                ]}
            />,
            { serverContext: { user: TEST_USER_EDITOR, moduleContext } }
        );

        const values = document.querySelectorAll('.filter-status-value');
        expect(values).toHaveLength(2);
        expect(values[0].textContent).toBe('Status = Available');
        expect(values[1].textContent).toBe('Sample ID');
        expect(values[1].querySelectorAll('.fa-sort-amount-asc')).toHaveLength(1);
        expect(values[1].parentElement.getAttribute('title')).toBe('Sorted ascending');
        // display only: no remove affordance on hover
        expect(document.querySelectorAll('.fa-close')).toHaveLength(0);
    });

    test('descending sort', () => {
        renderWithAppContext(
            <SaveViewModal
                {...DEFAULT_PROPS}
                currentView={VIEW_1}
                sortActionValues={[
                    {
                        action: new SortAction(),
                        displayValue: 'Sample ID',
                        isRemovable: false,
                        value: 'SampleID DESC',
                        valueObject: new QuerySort({ fieldKey: 'SampleID', dir: '-' }),
                    },
                ]}
            />,
            { serverContext: { user: TEST_USER_EDITOR, moduleContext } }
        );

        const sortTag = document.querySelector('.filter-status-value');
        expect(sortTag.textContent).toBe('Sample ID');
        expect(sortTag.querySelectorAll('.fa-sort-amount-desc')).toHaveLength(1);
        expect(sortTag.parentElement.getAttribute('title')).toBe('Sorted descending');
    });

    test('session view uses the shadowed view inherit flag', () => {
        renderWithAppContext(<SaveViewModal {...DEFAULT_PROPS} currentView={SESSION_VIEW_SHADOWING_INHERITED} />, {
            serverContext: {
                user: TEST_USER_APP_ADMIN,
                container: {
                    path: '/home',
                    type: 'project',
                },
                moduleContext,
            },
        });

        expect(document.querySelector('input[name="setInherit"]').hasAttribute('checked')).toBe(true);
    });

    test('session view shadowing a view that is not inherited', () => {
        renderWithAppContext(<SaveViewModal {...DEFAULT_PROPS} currentView={SESSION_VIEW_SHADOWING_LOCAL} />, {
            serverContext: {
                user: TEST_USER_APP_ADMIN,
                container: {
                    path: '/home',
                    type: 'project',
                },
                moduleContext,
            },
        });

        expect(document.querySelector('input[name="setInherit"]').hasAttribute('checked')).toBe(false);
    });

    // GitHub Issue #899
    test('subfolder save does not inherit', async () => {
        const onConfirmSave = jest.fn();
        renderWithAppContext(
            <SaveViewModal {...DEFAULT_PROPS} currentView={DEFAULT_VIEW} onConfirmSave={onConfirmSave} />,
            {
                serverContext: {
                    user: TEST_USER_APP_ADMIN,
                    container: {
                        path: '/home/folderA',
                        type: 'folder',
                    },
                    moduleContext,
                },
            }
        );

        expect(document.querySelectorAll('input[name="setInherit"]')).toHaveLength(0);

        await userEvent.click(document.querySelector('.btn-success'));

        // canInherit must be false: the inherited view lives in the home folder, so saving it would target that folder
        expect(onConfirmSave).toHaveBeenCalledWith('', false, false, true);
    });

    test('session view uses the shadowed view shared flag', async () => {
        const onConfirmSave = jest.fn();
        renderWithAppContext(
            <SaveViewModal
                {...DEFAULT_PROPS}
                currentView={SESSION_VIEW_SHADOWING_SHARED}
                onConfirmSave={onConfirmSave}
            />,
            {
                serverContext: {
                    user: TEST_USER_PROJECT_ADMIN,
                    container: {
                        path: '/home',
                        type: 'project',
                    },
                    moduleContext,
                },
            }
        );

        expect(document.querySelector('input[name="setShared"]').hasAttribute('checked')).toBe(true);

        await userEvent.click(document.querySelector('.btn-success'));

        // re-saving a shared view must not silently demote it to a private view shadowing the shared one
        expect(onConfirmSave).toHaveBeenCalledWith('View1', false, true, true);
    });

    test('session view shadowing a private view', () => {
        renderWithAppContext(<SaveViewModal {...DEFAULT_PROPS} currentView={SESSION_VIEW_SHADOWING_PRIVATE} />, {
            serverContext: {
                user: TEST_USER_PROJECT_ADMIN,
                container: {
                    path: '/home',
                    type: 'project',
                },
                moduleContext,
            },
        });

        expect(document.querySelector('input[name="setShared"]').hasAttribute('checked')).toBe(false);
    });

    // GitHub Issue #899: the core scenario — a subfolder session view over a view inherited from the home folder
    test('subfolder session view shadowing an inherited view does not inherit', async () => {
        const onConfirmSave = jest.fn();
        renderWithAppContext(
            <SaveViewModal
                {...DEFAULT_PROPS}
                currentView={SESSION_VIEW_SHADOWING_INHERITED}
                onConfirmSave={onConfirmSave}
            />,
            {
                serverContext: {
                    user: TEST_USER_APP_ADMIN,
                    container: {
                        path: '/home/folderA',
                        type: 'folder',
                    },
                    moduleContext,
                },
            }
        );

        expect(document.querySelectorAll('input[name="setInherit"]')).toHaveLength(0);

        await userEvent.click(document.querySelector('.btn-success'));

        // shadowed.inherit is true, but sending it would rewrite the home folder's view instead of shadowing it here
        expect(onConfirmSave).toHaveBeenCalledWith('', false, false, true);
    });

    // GitHub Issue #899
    test('session view shadowing a shared view without edit-shared permission', async () => {
        const onConfirmSave = jest.fn();
        renderWithAppContext(
            <SaveViewModal
                {...DEFAULT_PROPS}
                currentView={SESSION_VIEW_SHADOWING_SHARED}
                onConfirmSave={onConfirmSave}
            />,
            {
                serverContext: {
                    user: TEST_USER_READER,
                    container: {
                        path: '/home',
                        type: 'project',
                    },
                    moduleContext,
                },
            }
        );

        expect(document.querySelectorAll('input[name="setShared"]')).toHaveLength(0);

        await userEvent.click(document.querySelector('.btn-success'));

        // the shadowed view's shared flag is unusable here: the save action rejects shared/inherit outright
        expect(onConfirmSave).toHaveBeenCalledWith('View1', false, true, false);
    });

    // GitHub Issue #899
    test('inherit flag preserved when product folders are disabled', async () => {
        const onConfirmSave = jest.fn();
        renderWithAppContext(<SaveViewModal {...DEFAULT_PROPS} currentView={VIEW_2} onConfirmSave={onConfirmSave} />, {
            serverContext: {
                user: TEST_USER_PROJECT_ADMIN,
                container: {
                    path: '/home',
                    type: 'project',
                },
                moduleContext: { query: { isProductFoldersEnabled: false } },
            },
        });

        // the checkbox is product-folders-only, but the view's own folder is the save target so inherit still applies
        expect(document.querySelectorAll('input[name="setInherit"]')).toHaveLength(0);

        await userEvent.click(document.querySelector('.btn-success'));

        expect(onConfirmSave).toHaveBeenCalledWith('View2', true, true, false);
    });
});

describe('ViewNameInput', () => {
    test('default view', () => {
        render(<ViewNameInput onBlur={jest.fn()} view={ViewInfo.fromJson({ default: true, name: 'default' })} />);
        const input = document.querySelector('input');
        expect(input.getAttribute('value')).toBe('');
        const warning = document.querySelectorAll('.text-danger');
        expect(warning).toHaveLength(0);
    });

    test('hidden view', () => {
        render(
            <ViewNameInput
                onBlur={jest.fn()}
                view={ViewInfo.fromJson({ default: false, name: 'Sample Finder', hidden: true })}
            />
        );
        const input = document.querySelector('input');
        expect(input.getAttribute('value')).toBe('');
        const warning = document.querySelectorAll('.text-danger');
        expect(warning).toHaveLength(0);
    });

    test('valid named view', async () => {
        render(<ViewNameInput onBlur={jest.fn()} view={ViewInfo.fromJson({ default: false, name: 'Save Me' })} />);
        const input = document.querySelector('input');
        expect(input.getAttribute('value')).toBe('Save Me');
        let warning = document.querySelectorAll('.text-danger');
        expect(warning).toHaveLength(0);
        await userEvent.type(input, 'Save Me 2');
        warning = document.querySelectorAll('.text-danger');
        expect(warning).toHaveLength(0);
    });

    test('invalid named view', async () => {
        render(
            <ViewNameInput
                maxLength={10}
                onBlur={jest.fn()}
                view={ViewInfo.fromJson({ default: false, name: 'Save Me' })}
            />
        );
        let warning = document.querySelectorAll('.text-danger');
        expect(warning).toHaveLength(0);
        const input = document.querySelector('input');
        await userEvent.type(input, '12345 78901');
        warning = document.querySelectorAll('.text-danger');
        expect(warning).toHaveLength(1);
        expect(warning[0].textContent).toBe('Current length: 18; maximum length: 10');
    });
});
