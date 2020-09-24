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

import { mount, shallow } from 'enzyme';

import { FileAttachmentContainer } from './FileAttachmentContainer';

describe('<FileAttachmentContainer/>', () => {
    test('no props', () => {
        const wrapper = shallow(<FileAttachmentContainer allowMultiple={false} allowDirectories={false} />);
        expect(wrapper).toMatchSnapshot();
    });

    test('with attributes', () => {
        const wrapper = shallow(
            <FileAttachmentContainer
                acceptedFormats=".tsv, .xls, .xlsx"
                allowMultiple={false}
                allowDirectories={false}
            />
        );
        expect(wrapper).toMatchSnapshot();
    });

    test('error msg', () => {
        const page = mount(
            <FileAttachmentContainer
                acceptedFormats=".tsv, .xls, .xlsx"
                allowMultiple={false}
                allowDirectories={false}
            />
        );

        // haven't figured out how to get a file to upload to perform some of the
        // validation, so we will just test that the error message is rendered correctly
        page.setState({ errorMsg: 'invalid file' });
        expect(page).toMatchSnapshot();

        page.unmount();
    });

    test('with single file', () => {
        const page = mount(<FileAttachmentContainer allowMultiple={false} allowDirectories={false} />);

        expect(page.find('.file-upload--container')).toHaveLength(1);
        expect(page.find('.attached-file--container')).toHaveLength(0);

        page.setState({
            fileNames: ['files1'],
        });
        expect(page.find('.file-upload--container').props().className).toContain('hidden');
        expect(page.find('.attached-file--container')).toHaveLength(1);

        page.unmount();
    });

    test('with multiple files', () => {
        const page = mount(<FileAttachmentContainer allowMultiple={true} allowDirectories={false} />);

        expect(page.find('.file-upload--container')).toHaveLength(1);
        expect(page.find('.attached-file--container')).toHaveLength(0);

        page.setState({
            fileNames: ['files1', 'files2'],
        });
        expect(page.find('.file-upload--container').props().className).toContain('block');
        expect(page.find('.attached-file--container')).toHaveLength(2);

        page.unmount();
    });

    test('with initial file names', () => {
        const page = mount(
            <FileAttachmentContainer
                allowMultiple={true}
                allowDirectories={false}
                initialFileNames={['initial1.txt', 'initial2.csv']}
            />
        );

        expect(page.find('.file-upload--container').props().className).toContain('block');
        expect(page.find('.attached-file--container')).toHaveLength(2);

        page.unmount();
    });

    test('with initial single file name - no multiples allowed', () => {
        const page = mount(
            <FileAttachmentContainer allowMultiple={false} allowDirectories={false} initialFileNames={['single.csv']} />
        );

        expect(page.find('.file-upload--container').props().className).toContain('hidden');
        expect(page.find('.attached-file--container')).toHaveLength(1);

        page.unmount();
    });
});
