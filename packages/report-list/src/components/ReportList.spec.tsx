import * as React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';
import {ReportItemModal, ReportList, ReportListItem} from './ReportList';
import { flattenApiResponse } from '../model';
import exampleData from '../test_data/example_browse_data_tree_api.json';
import { LoadingSpinner } from '@glass/base';

const noop = () => {};
const messageSelector = '.report-list__message';
const createdBySelector = '.report-list-item__person';

describe('<ReportList />', () => {
    test('flattenApiResponse works with valid data', () => {
        flattenApiResponse(exampleData);
    });

    test('Render with no data', () => {
        const component = <ReportList loading={false} reports={[]} onReportClicked={noop}/>;
        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();
        const wrapper = mount(component);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.find(messageSelector).text()).toContain('No reports');
    });

    test('Render loading', () => {
        const component = <ReportList loading={true} reports={[]} onReportClicked={noop}/>;
        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();
        const wrapper = mount(component);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
    });

    test('Render with data', () => {
        const reports = flattenApiResponse(exampleData);
        const component = <ReportList loading={false} reports={reports} onReportClicked={noop}/>;
        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();
        const wrapper = mount(component);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.find(ReportListItem)).toHaveLength(reports.length);
    });

    test('onReportClicked should execute on click', () => {
        const reports = flattenApiResponse(exampleData).slice(0, 1);
        const onReportClicked = jest.fn();
        const component = <ReportList loading={false} reports={reports} onReportClicked={onReportClicked}/>;
        const wrapper = mount(component);
        wrapper.find(ReportListItem).simulate('click');
        expect(onReportClicked).toHaveBeenCalledTimes(1);
    });
});

describe('<ReportListItem />', () => {
    test('ReportListItem renders', () => {
        const report = flattenApiResponse(exampleData)[0];
        const onClick = jest.fn();
        const component = <ReportListItem report={report} onClick={onClick}/>;
        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();
        const wrapper = mount(component);
        expect(wrapper.find(createdBySelector)).toHaveLength(1);
        expect(wrapper.text()).toContain(report.createdBy);
        expect(wrapper.text()).toContain(report.name);
        // Enzyme prefixes relative URLs with http://localhost
        const expectedHref = `http://localhost${report.detailsUrl}`;
        expect(wrapper.find('a').getDOMNode()).toHaveProperty('href', expectedHref);
    });

    test('ReportListItem does not render non-existent createdBy', () => {
        const reports = flattenApiResponse(exampleData);
        const report = reports.filter(r => !r.hasOwnProperty('createdBy'))[0];
        const component = <ReportListItem report={report} onClick={noop}/>;
        const wrapper = mount(component);
        expect(wrapper.find(createdBySelector)).toHaveLength(0);
    });

    test('ReportListItem calls onClick when clicked', () => {
        const report = flattenApiResponse(exampleData)[0];
        const onClick = jest.fn();
        const component = <ReportListItem report={report} onClick={onClick}/>;
        const wrapper = mount(component);
        wrapper.simulate('click');
        expect(onClick).toHaveBeenCalledTimes(1);
        // Test that we pass the report to onClick. If this test fails that means we'll need to fix any callbacks that
        // expect a report to be passed to the callback.
        expect(onClick.mock.calls[0][0]).toBe(report);
    });
});

describe('<ReportItemModal />', () => {
    test('ReportItemModal renders', () => {
        const report = flattenApiResponse(exampleData)[0];
        const component = <ReportItemModal report={report} onClose={noop} />;
        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();
    });
});
