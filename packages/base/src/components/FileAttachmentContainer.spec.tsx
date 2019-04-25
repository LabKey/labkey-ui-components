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
    });

    test("error msg", () => {
        const page = mount(<FileAttachmentContainer
            acceptedFormats={'.tsv, .xls, .xlsx'}
            allowMultiple={false}
            allowDirectories={false}/>);

        // haven't figured out how to get a file to upload to perform some of the
        // validation, so we will just test that the error message is rendered correctly
        page.setState({errorMsg : 'invalid file'})
        expect(page).toMatchSnapshot();
    });
});