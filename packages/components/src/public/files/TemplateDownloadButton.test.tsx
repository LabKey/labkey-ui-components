import React from 'react';
import { waitFor } from '@testing-library/dom';

import { userEvent } from '@testing-library/user-event';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../../internal/userFixtures';

import { renderWithAppContext } from '../../internal/test/reactTestLibraryHelpers';

import { SchemaQuery } from '../SchemaQuery';
import { getTestAPIWrapper } from '../../internal/APIWrapper';
import { getQueryTestAPIWrapper } from '../../internal/query/APIWrapper';
import { QueryInfo } from '../QueryInfo';

import { TemplateDownloadButton } from './TemplateDownloadButton';

const TEMPLATES = [
    {
        label: 'default',
        url: '/labkey/query-exportExcelTemplate.view?schemaName=samples&query.queryName=NameExpr&headerType=DisplayFieldKey',
    },
    { label: 'template1', url: '/samples/temp1.csv' },
    { label: 'temp2', url: '/samples/bloodtemplate.csv' },
];

const APP_CONTEXT = {
    api: getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            getQueryDetails: jest.fn().mockResolvedValue(
                QueryInfo.fromJsonForTests({
                    importTemplates: TEMPLATES,
                })
            ),
        }),
    }),
};

describe('TemplateDownloadButton', () => {
    test('no onDownloadDefault or defaultTemplateUrl', () => {
        const { container } = renderWithAppContext(<TemplateDownloadButton />);
        expect(container).toHaveTextContent('');
    });

    test('no onDownloadDefault, empty defaultTemplateUrl', () => {
        const { container } = renderWithAppContext(<TemplateDownloadButton defaultTemplateUrl="" />);
        expect(container).toHaveTextContent('');
    });

    test('reader', () => {
        const { container } = renderWithAppContext(
            <TemplateDownloadButton defaultTemplateUrl="" user={TEST_USER_READER} />
        );
        expect(container).toHaveTextContent('');
    });

    test('editor', () => {
        const { container } = renderWithAppContext(
            <TemplateDownloadButton defaultTemplateUrl="testUrl" user={TEST_USER_EDITOR} />,
            {}
        );
        expect(container).toHaveTextContent('Template');
        expect(document.querySelectorAll('span.fa-download')).toHaveLength(1);
    });

    test('with custom templates, with defaultTemplateUrl', async () => {
        renderWithAppContext(
            <TemplateDownloadButton
                defaultTemplateUrl="testUrl"
                schemaQuery={new SchemaQuery('a', 'b')}
                user={TEST_USER_EDITOR}
            />,
            { appContext: APP_CONTEXT }
        );

        await waitFor(() => {
            expect(document.querySelectorAll('span.fa-download')).toHaveLength(1);
        });

        const button = document.querySelector('button.btn-info');
        expect(button).toHaveTextContent('Template');
        await userEvent.click(button);

        expect(document.querySelectorAll('.dropdown')).toHaveLength(1);
        const dropdown = document.querySelector('.dropdown');
        const menuItems = dropdown.querySelectorAll('li');
        expect(menuItems).toHaveLength(3);
        const downloadLinks = dropdown.querySelectorAll('a');
        expect(downloadLinks).toHaveLength(3);
        expect(downloadLinks[0]).toHaveTextContent('Default Template');
        expect(downloadLinks[1]).toHaveTextContent(TEMPLATES[1].label);
        expect(downloadLinks[2]).toHaveTextContent(TEMPLATES[2].label);
    });

    test('with custom templates, with onDownloadDefault', async () => {
        renderWithAppContext(
            <TemplateDownloadButton
                onDownloadDefault={jest.fn()}
                schemaQuery={new SchemaQuery('a', 'b')}
                user={TEST_USER_EDITOR}
            />,
            { appContext: APP_CONTEXT }
        );

        await waitFor(() => {
            expect(document.querySelectorAll('span.fa-download')).toHaveLength(1);
        });

        const button = document.querySelector('button.btn-info');
        expect(button).toHaveTextContent('Template');
        await userEvent.click(button);

        expect(document.querySelectorAll('.dropdown')).toHaveLength(1);
        const dropdown = document.querySelector('.dropdown');
        const menuItems = dropdown.querySelectorAll('li');
        expect(menuItems).toHaveLength(3);
        const downloadLinks = dropdown.querySelectorAll('a');
        expect(downloadLinks).toHaveLength(3);
        expect(downloadLinks[0]).toHaveTextContent('Default Template');
        expect(downloadLinks[1]).toHaveTextContent(TEMPLATES[1].label);
        expect(downloadLinks[2]).toHaveTextContent(TEMPLATES[2].label);
    });

    test('editor, with custom properties', () => {
        const { container } = renderWithAppContext(
            <TemplateDownloadButton
                onDownloadDefault={jest.fn()}
                text="Test Text"
                className="custom-styling"
                user={TEST_USER_EDITOR}
            />
        );
        expect(container).toHaveTextContent('Test Text');
        expect(document.querySelectorAll('span.fa-download')).toHaveLength(1);
        expect(document.querySelectorAll('.custom-styling')).toHaveLength(1);
    });
});
