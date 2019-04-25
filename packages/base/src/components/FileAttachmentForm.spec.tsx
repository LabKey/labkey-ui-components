import * as React from 'react';
import { fromJS } from "immutable";
import { FileAttachmentForm } from "./FileAttachmentForm";
import { shallow, mount } from "enzyme";

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

    test('buttons with attachedFiles', () => {
        const wrapper = mount(<FileAttachmentForm
            showButtons={true}
        />);

        let btn = wrapper.find('button.file-form-submit-btn');
        expect(btn).toHaveLength(1);
        expect(btn.props().disabled).toBe(true);

        wrapper.setState({
            attachedFiles: fromJS({'file1': new Blob(['text'], {type : 'text/plain'})})
        });

        btn = wrapper.find('button.file-form-submit-btn');
        expect(btn).toHaveLength(1);
        expect(btn.props().disabled).toBe(false);

        wrapper.unmount();
    });
});