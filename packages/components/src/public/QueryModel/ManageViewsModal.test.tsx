/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';

import { ViewInfo } from '../../internal/ViewInfo';

import { renderWithAppContext } from '../../internal/test/reactTestLibraryHelpers';
import { TEST_USER_PROJECT_ADMIN, TEST_USER_READER } from '../../internal/userFixtures';

import { getTestAPIWrapper } from '../../internal/APIWrapper';
import { getQueryTestAPIWrapper } from '../../internal/query/APIWrapper';

import { ManageViewsModal, ViewLabel } from './ManageViewsModal';

const getQueryAPI = (views: ViewInfo[]) => {
    return getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            getGridViews: jest.fn().mockResolvedValue(views),
        }),
    });
};

const SYSTEM_DEFAULT_VIEW = ViewInfo.fromJson({
    default: true,
    saved: false, // cannot be reverted
});

const SYSTEM_DETAIL_VIEW = ViewInfo.fromJson({
    saved: false, // cannot be reverted
    name: ViewInfo.DETAIL_NAME,
});

const SHARED_DEFAULT_VIEW = ViewInfo.fromJson({
    default: true,
    saved: true, // can be reverted
    shared: true,
});

const MY_DEFAULT_VIEW = ViewInfo.fromJson({
    default: true,
    saved: true, // can be reverted
});

const VIEW_1 = ViewInfo.fromJson({
    default: false,
    label: 'View 1',
    name: 'View1',
});

const SESSION_VIEW = ViewInfo.fromJson({
    default: false,
    label: 'View 2',
    name: 'View2',
    session: true,
});

const SHARED_VIEW = ViewInfo.fromJson({
    default: false,
    label: 'View 3',
    name: 'View3',
    shared: true,
});

describe('ViewLabel', () => {
    test('default view', () => {
        const { container } = render(<ViewLabel view={SYSTEM_DEFAULT_VIEW} />);
        expect(container.textContent).toBe('Default View');
    });

    test('own default view', () => {
        const { container } = render(<ViewLabel view={MY_DEFAULT_VIEW} />);
        expect(container.textContent).toBe('My Default View');
    });

    test('shared default view', () => {
        const { container } = render(<ViewLabel view={SHARED_DEFAULT_VIEW} />);
        expect(container.textContent).toBe('Default View (shared)');
    });

    test('default view, edited', () => {
        const { container } = render(<ViewLabel view={ViewInfo.fromJson({ default: true, session: true })} />);
        expect(container.textContent).toBe('Default View (edited)');
    });

    test('shared view', () => {
        const { container } = render(<ViewLabel view={SHARED_VIEW} />);
        expect(container.textContent).toBe('View 3 (shared)');
    });

    test('shared view, edited', () => {
        const { container } = render(
            <ViewLabel
                view={ViewInfo.fromJson({
                    label: 'View 3',
                    name: 'View3',
                    session: true,
                })}
            />
        );
        expect(container.textContent).toBe('View 3 (edited)');
    });

    test('inherited view', () => {
        const { container } = render(
            <ViewLabel
                view={ViewInfo.fromJson({
                    label: 'View 4',
                    name: 'View4',
                    shared: false,
                    inherit: true,
                })}
            />
        );
        expect(container.textContent).toBe('View 4 (inherited)');
    });

    test('inherited view, edited', () => {
        const { container } = render(
            <ViewLabel
                view={ViewInfo.fromJson({
                    label: 'View 4',
                    name: 'View4',
                    shared: false,
                    inherit: true,
                    session: true,
                })}
            />
        );
        expect(container.textContent).toBe('View 4 (edited)');
    });

    test('shared, inherited view', () => {
        const { container } = render(
            <ViewLabel
                view={ViewInfo.fromJson({
                    label: 'View 5',
                    name: 'View5',
                    shared: true,
                    inherit: true,
                })}
            />
        );
        expect(container.textContent).toBe('View 5 (inherited, shared)');
    });

    test('edited, shared, inherited view', () => {
        const { container } = render(
            <ViewLabel
                view={ViewInfo.fromJson({
                    label: 'View 5',
                    name: 'View5',
                    shared: true,
                    inherit: true,
                    session: true,
                })}
            />
        );
        expect(container.textContent).toBe('View 5 (edited)');
    });
});

describe('ManageViewsModal', () => {
    test('no views', async () => {
        renderWithAppContext(<ManageViewsModal currentView={null} onDone={jest.fn()} schemaQuery={null} />, {
            appContext: { api: getQueryAPI([]) },
            serverContext: { user: TEST_USER_READER },
        });

        expect(document.querySelector('.fa-spinner')).not.toBeNull();
        await waitFor(() => {
            expect(document.querySelector('.fa-spinner')).toBeNull();
        });

        const rows = document.querySelectorAll('.row.small-margin-bottom');
        expect(rows).toHaveLength(0);
    });

    test('multiple saved views: default, named, shared and session view', async () => {
        renderWithAppContext(<ManageViewsModal currentView={null} onDone={jest.fn()} schemaQuery={null} />, {
            appContext: { api: getQueryAPI([SHARED_DEFAULT_VIEW, VIEW_1, SESSION_VIEW, SHARED_VIEW]) },
            serverContext: { user: TEST_USER_PROJECT_ADMIN },
        });

        expect(document.querySelector('.fa-spinner')).not.toBeNull();
        await waitFor(() => {
            expect(document.querySelector('.fa-spinner')).toBeNull();
        });

        expect(document.querySelector('.modal-title').textContent).toBe('Manage Saved Views');

        const rows = document.querySelectorAll('.row.small-margin-bottom');
        expect(rows).toHaveLength(4);

        expect(rows[0].querySelector('.col-xs-8').textContent.trim()).toBe('Default View (shared)');
        expect(rows[0].querySelectorAll('.fa-pencil')).toHaveLength(0);
        expect(rows[0].querySelectorAll('.fa-trash-o')).toHaveLength(0);
        expect(rows[0].querySelectorAll('.clickable-text')).toHaveLength(1);
        expect(rows[0].querySelector('.clickable-text').textContent).toBe('Revert');

        expect(rows[1].querySelector('.col-xs-8').textContent.trim()).toBe('View 1');
        expect(rows[1].querySelectorAll('.fa-pencil')).toHaveLength(1);
        expect(rows[1].querySelectorAll('.fa-trash-o')).toHaveLength(1);
        expect(rows[1].querySelectorAll('.clickable-text')).toHaveLength(3);
        expect(rows[1].querySelector('.clickable-text').textContent).toBe('Make default');

        expect(rows[2].querySelector('.col-xs-8').textContent.trim()).toBe('View 2 (edited)');
        expect(rows[2].querySelectorAll('.fa-pencil')).toHaveLength(0);
        expect(rows[2].querySelectorAll('.fa-trash-o')).toHaveLength(0);
        expect(rows[2].querySelectorAll('.clickable-text')).toHaveLength(1);
        expect(rows[2].querySelector('.clickable-text').textContent).toBe('Make default');

        expect(rows[3].querySelector('.col-xs-8').textContent.trim()).toBe('View 3 (shared)');
        expect(rows[3].querySelectorAll('.fa-pencil')).toHaveLength(1);
        expect(rows[3].querySelectorAll('.fa-trash-o')).toHaveLength(1);
        expect(rows[0].querySelectorAll('.gray-text')).toHaveLength(0);
        expect(rows[3].querySelectorAll('.clickable-text')).toHaveLength(3);
        expect(rows[3].querySelector('.clickable-text').textContent).toBe('Make default');

        expect(document.querySelector('button.btn-default').textContent).toEqual('Done');
    });

    test('system default view', async () => {
        renderWithAppContext(<ManageViewsModal currentView={null} onDone={jest.fn()} schemaQuery={null} />, {
            appContext: {
                api: getQueryAPI([SYSTEM_DEFAULT_VIEW, SYSTEM_DETAIL_VIEW, VIEW_1, SESSION_VIEW, SHARED_VIEW]),
            },
            serverContext: { user: TEST_USER_PROJECT_ADMIN },
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.row.small-margin-bottom')).toHaveLength(4);
        });

        const rows = document.querySelectorAll('.row.small-margin-bottom');
        expect(rows).toHaveLength(4);

        expect(rows[0].querySelector('.col-xs-8').textContent.trim()).toBe('Default View');
        expect(rows[0].querySelectorAll('.fa-pencil')).toHaveLength(0);
        expect(rows[0].querySelectorAll('.fa-trash-o')).toHaveLength(0);
        expect(rows[0].querySelectorAll('.clickable-text')).toHaveLength(0);
        expect(rows[0].querySelectorAll('.gray-text')).toHaveLength(1);
        expect(rows[0].querySelector('.gray-text').textContent).toBe('Revert');
    });

    test('multiple saved views: no admin permission', async () => {
        renderWithAppContext(<ManageViewsModal currentView={null} onDone={jest.fn()} schemaQuery={null} />, {
            appContext: { api: getQueryAPI([MY_DEFAULT_VIEW, VIEW_1, SESSION_VIEW, SHARED_VIEW]) },
            serverContext: { user: TEST_USER_READER },
        });

        expect(document.querySelector('.fa-spinner')).not.toBeNull();
        await waitFor(() => {
            expect(document.querySelector('.fa-spinner')).toBeNull();
        });

        expect(document.querySelector('.modal-title').textContent).toBe('Manage Saved Views');

        const rows = document.querySelectorAll('.row.small-margin-bottom');
        expect(rows).toHaveLength(4);

        expect(rows[0].querySelector('.col-xs-8').textContent.trim()).toBe('My Default View');
        expect(rows[0].querySelectorAll('.fa-pencil')).toHaveLength(0);
        expect(rows[0].querySelectorAll('.fa-trash-o')).toHaveLength(0);
        expect(rows[0].querySelectorAll('.clickable-text')).toHaveLength(0);

        expect(rows[1].querySelector('.col-xs-8').textContent.trim()).toBe('View 1');
        expect(rows[1].querySelectorAll('.fa-pencil')).toHaveLength(1);
        expect(rows[1].querySelectorAll('.fa-trash-o')).toHaveLength(1);
        expect(rows[1].querySelectorAll('.clickable-text')).toHaveLength(2);

        expect(rows[2].querySelector('.col-xs-8').textContent.trim()).toBe('View 2 (edited)');
        expect(rows[2].querySelectorAll('.fa-pencil')).toHaveLength(0);
        expect(rows[2].querySelectorAll('.fa-trash-o')).toHaveLength(0);
        expect(rows[2].querySelectorAll('.clickable-text')).toHaveLength(0);

        expect(rows[3].querySelector('.col-xs-8').textContent.trim()).toBe('View 3 (shared)');
        expect(rows[3].querySelectorAll('.fa-pencil')).toHaveLength(0);
        expect(rows[3].querySelectorAll('.fa-trash-o')).toHaveLength(0);
        expect(rows[3].querySelectorAll('.clickable-text')).toHaveLength(0);

        expect(document.querySelector('button.btn-default').textContent).toEqual('Done');
    });
});
