import * as React from 'react';
import { FileAttachmentForm } from "./FileAttachmentForm";
import { shallow } from "enzyme";

describe("<FileAttachmentForm/>", () => {

    test('no props', () => {
        const wrapper = shallow(<FileAttachmentForm/>);
        expect(wrapper).toMatchSnapshot();
    });

    test('with attributes', () => {
        const wrapper = shallow(<FileAttachmentForm
            acceptedFormats={'.tsv, .xls, .xlsx'}
            allowDirectories={false}
            allowMultiple={false}
            label={'file attachment'}/>);
        expect(wrapper).toMatchSnapshot();
    });
});