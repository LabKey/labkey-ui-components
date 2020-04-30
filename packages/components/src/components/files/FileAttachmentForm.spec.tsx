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
import { fromJS, List, Map } from 'immutable';

import { mount, shallow } from 'enzyme';

import { FileAttachmentForm } from './FileAttachmentForm';

describe('<FileAttachmentForm/>', () => {
    test('no props', () => {
        const wrapper = shallow(<FileAttachmentForm />);
        expect(wrapper).toMatchSnapshot();
    });

    test('with attributes', () => {
        const wrapper = shallow(
            <FileAttachmentForm
                acceptedFormats=".tsv, .xls, .xlsx"
                allowDirectories={false}
                allowMultiple={false}
                label="file attachment"
                templateUrl="#downloadtemplateurl"
            />
        );
        expect(wrapper).toMatchSnapshot();
    });

    test('buttons with attachedFiles', () => {
        const wrapper = mount(<FileAttachmentForm showButtons={true} />);

        let btn = wrapper.find('button.file-form-submit-btn');
        expect(btn).toHaveLength(1);
        expect(btn.props().disabled).toBe(true);

        wrapper.setState({
            attachedFiles: fromJS({ file1: new Blob(['text'], { type: 'text/plain' }) }),
        });

        btn = wrapper.find('button.file-form-submit-btn');
        expect(btn).toHaveLength(1);
        expect(btn.props().disabled).toBe(false);

        wrapper.unmount();
    });

    test('with previewGridProps', () => {
        const wrapper = mount(
            <FileAttachmentForm
                previewGridProps={{
                    previewCount: 1,
                }}
            />
        );
        expect(wrapper.find('FilePreviewGrid')).toHaveLength(0);
        expect(wrapper.find('LoadingSpinner')).toHaveLength(0);

        wrapper.setState({
            previewStatus: 'With preview status',
            errorMessage: undefined,
            previewData: undefined,
        });
        expect(wrapper.find('FilePreviewGrid')).toHaveLength(0);
        expect(wrapper.find('LoadingSpinner')).toHaveLength(1);

        wrapper.setState({
            previewStatus: undefined,
            errorMessage: 'With error message',
            previewData: undefined,
        });
        expect(wrapper.find('FilePreviewGrid')).toHaveLength(1);
        expect(wrapper.find('LoadingSpinner')).toHaveLength(0);

        wrapper.setState({
            previewStatus: undefined,
            errorMessage: undefined,
            previewData: List<Map<string, any>>(),
        });
        expect(wrapper.find('FilePreviewGrid')).toHaveLength(1);
        expect(wrapper.find('LoadingSpinner')).toHaveLength(0);

        wrapper.unmount();
    });
});
