import * as React from 'react';
import { fromJS, List, Map } from "immutable";
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

    test('with previewGridProps', () => {
        const wrapper = mount(<FileAttachmentForm
            previewGridProps={{
                previewCount: 1
            }}
        />);
        expect(wrapper.find('FilePreviewGrid')).toHaveLength(0);
        expect(wrapper.find('LoadingSpinner')).toHaveLength(0);

        wrapper.setState({
            previewStatus: 'With preview status',
            errorMessage: undefined,
            previewData: undefined
        });
        expect(wrapper.find('FilePreviewGrid')).toHaveLength(0);
        expect(wrapper.find('LoadingSpinner')).toHaveLength(1);

        wrapper.setState({
            previewStatus: undefined,
            errorMessage: 'With error message',
            previewData: undefined
        });
        expect(wrapper.find('FilePreviewGrid')).toHaveLength(1);
        expect(wrapper.find('LoadingSpinner')).toHaveLength(0);

        wrapper.setState({
            previewStatus: undefined,
            errorMessage: undefined,
            previewData: List<Map<string, any>>()
        });
        expect(wrapper.find('FilePreviewGrid')).toHaveLength(1);
        expect(wrapper.find('LoadingSpinner')).toHaveLength(0);

        wrapper.unmount();
    });
});