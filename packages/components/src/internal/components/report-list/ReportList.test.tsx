/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import exampleData from '../../../test/data/example_browse_data_tree_api.json';

import { AppURL } from '../../url/AppURL';
import { flattenBrowseDataTreeResponse } from '../../query/reports';

import { ReportItemModal, ReportList, ReportListItem } from './ReportList';

const noop = () => {};
const messageSelector = '.report-list__message';
const createdBySelector = '.report-list-item__person';
const urlMapper = report => {
    const { schemaName, queryName, viewName } = report;

    if (!queryName) {
        return null;
    }

    const parts = ['q', schemaName, queryName];

    if (viewName) {
        parts.push(viewName);
    }

    return AppURL.create(...parts);
};

describe('<ReportList />', () => {
    test('flattenBrowseDataTreeResponse works with valid data', () => {
        flattenBrowseDataTreeResponse(exampleData, urlMapper);
    });

    test('Render with no data', () => {
        const { container } = render(<ReportList loading={false} reports={[]} onReportClicked={noop} />);
        expect(container.querySelectorAll('.fa-spinner')).toHaveLength(0);
        expect(container.querySelector(messageSelector).textContent).toContain('No reports');
    });

    test('Render loading', () => {
        const { container } = render(<ReportList loading={true} reports={[]} onReportClicked={noop} />);
        expect(container.querySelectorAll('.fa-spinner')).toHaveLength(1);
    });

    test('Render with data', () => {
        const reports = flattenBrowseDataTreeResponse(exampleData, urlMapper);
        const { container } = render(<ReportList loading={false} reports={reports} onReportClicked={noop} />);
        expect(container.querySelectorAll('.fa-spinner')).toHaveLength(0);
        expect(container.querySelectorAll('.report-list-item')).toHaveLength(reports.length);
    });

    test('onReportClicked should execute on click', () => {
        const reports = flattenBrowseDataTreeResponse(exampleData, urlMapper).slice(0, 1);
        const onReportClicked = jest.fn();
        const { container } = render(
            <ReportList loading={false} reports={reports} onReportClicked={onReportClicked} />
        );
        fireEvent.click(container.querySelector('.report-list-item'));
        expect(onReportClicked).toHaveBeenCalledTimes(1);
    });
});

describe('<ReportListItem />', () => {
    test('ReportListItem renders', () => {
        const report = flattenBrowseDataTreeResponse(exampleData, urlMapper)[1];
        const onClick = jest.fn();
        const { container } = render(<ReportListItem report={report} onClick={onClick} />);
        expect(container.querySelectorAll(createdBySelector)).toHaveLength(1);
        expect(container.textContent).toContain(report.createdBy);
        expect(container.textContent).toContain(report.name);
        // jsdom prefixes relative URLs with http://localhost
        const expectedHref = `http://localhost/#${report.appUrl.toString()}`;
        expect(container.querySelector('a')).toHaveProperty('href', expectedHref);
    });

    test('ReportListItem does not render non-existent createdBy', () => {
        const reports = flattenBrowseDataTreeResponse(exampleData, urlMapper);
        const report = reports[1];
        report.createdBy = undefined;
        const { container } = render(<ReportListItem report={report} onClick={noop} />);
        expect(container.querySelectorAll(createdBySelector)).toHaveLength(0);
    });

    test('ReportListItem calls onClick when clicked', () => {
        const report = flattenBrowseDataTreeResponse(exampleData, urlMapper)[0];
        const onClick = jest.fn();
        const { container } = render(<ReportListItem report={report} onClick={onClick} />);
        fireEvent.click(container.querySelector('.report-list-item'));
        expect(onClick).toHaveBeenCalledTimes(1);
        // Test that we pass the report to onClick. If this test fails that means we'll need to fix any callbacks that
        // expect a report to be passed to the callback.
        expect(onClick.mock.calls[0][0]).toBe(report);
    });
});

describe('<ReportItemModal />', () => {
    test('ReportItemModal renders', () => {
        // Arrange
        const report = flattenBrowseDataTreeResponse(exampleData, urlMapper)[0];
        const onClose = jest.fn();

        // Act
        render(<ReportItemModal report={report} onClose={onClose} />);

        // Assert
        // Verify modal displays properly (Modal uses a portal, so use document.querySelector)
        expect(document.querySelector('.modal-title').textContent).toEqual(report.name);

        // Verify report items are listed
        const reportItems = document.querySelectorAll('.report-item__metadata-item span');
        expect(reportItems.length).toEqual(3);
        expect(reportItems[0].textContent).toEqual(report.createdBy);
        expect(reportItems[1].textContent).toEqual(report.type);
        expect(reportItems[2].textContent).toEqual(report.description);
    });
});
