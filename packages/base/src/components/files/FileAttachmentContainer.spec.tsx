import * as React from 'react';
import { FileAttachmentContainer } from "./FileAttachmentContainer";
import {mount, shallow} from "enzyme";

describe("<FileAttachmentContainer/>", () => {

    test('no props', () => {
        const wrapper = shallow(<FileAttachmentContainer
            allowMultiple={false}
            allowDirectories={false}/>);
        expect(wrapper).toMatchSnapshot();
    });

    test('with attributes', () => {
        const wrapper = shallow(<FileAttachmentContainer
            acceptedFormats={'.tsv, .xls, .xlsx'}
            allowMultiple={false}
            allowDirectories={false}/>);
        expect(wrapper).toMatchSnapshot();
    });

    test("change handler", () => {
        const onChange = jest.fn(event => undefined);
        const page = mount(<FileAttachmentContainer
            acceptedFormats={'.tsv, .xls, .xlsx'}
            allowMultiple={false}
            handleChange={onChange}
            allowDirectories={false}/>);

        // create some files
        const testFile = new Blob(['text'], {type : 'text/html'});
        testFile['name'] = 'foo.txt';
        page.find('input').simulate('change', {target: [testFile]});
        expect(onChange).toHaveBeenCalledTimes(1);

        page.unmount();
    });

    test("error msg", () => {
        const page = mount(<FileAttachmentContainer
            acceptedFormats={'.tsv, .xls, .xlsx'}
            allowMultiple={false}
            allowDirectories={false}/>);

        // haven't figured out how to get a file to upload to perform some of the
        // validation, so we will just test that the error message is rendered correctly
        page.setState({errorMsg : 'invalid file'});
        expect(page).toMatchSnapshot();

        page.unmount();
    });

    test('with single file', () => {
        const page = mount(
            <FileAttachmentContainer
                allowMultiple={false}
                allowDirectories={false}
            />
        );

        expect(page.find('.file-upload--container')).toHaveLength(1);
        expect(page.find('.attached-file--container')).toHaveLength(0);

        page.setState({
            files: {'files1': new Blob(['text'], {type : 'text/plain'})}
        });
        expect(page.find('.file-upload--container').props().className).toContain("hidden");
        expect(page.find('.attached-file--container')).toHaveLength(1);

        page.unmount();
    });

    test('with multiple files', () => {
        const page = mount(
            <FileAttachmentContainer
                allowMultiple={true}
                allowDirectories={false}
            />
        );

        expect(page.find('.file-upload--container')).toHaveLength(1);
        expect(page.find('.attached-file--container')).toHaveLength(0);

        page.setState({
            files: {
                'files1': new Blob(['text'], {type : 'text/plain'}),
                'files2': new Blob(['text'], {type : 'text/plain'})
            }
        });
        expect(page.find('.file-upload--container').props().className).toContain("block");
        expect(page.find('.attached-file--container')).toHaveLength(2);

        page.unmount();
    });
});