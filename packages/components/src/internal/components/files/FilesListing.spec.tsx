import React from 'react';
import { List, Set } from 'immutable';
import { shallow } from 'enzyme';

import { FILES_DATA } from '../../../test/data/constants';

import { IFile } from './models';
import { FilesListing } from './FilesListing';

describe('<FilesListing>', () => {
    test('no files', () => {
        const wrapper = shallow(
            <FilesListing
                noFilesMessage="No files for you"
                onFileSelection={jest.fn()}
                selectedFiles={Set<string>()}
                files={List<IFile>()}
            />
        );
        expect(wrapper.text()).toBe('No files for you');
        expect(wrapper).toMatchSnapshot();
    });
    test('with files custom header', () => {
        const wrapper = shallow(
            <FilesListing
                headerText="Custom header"
                noFilesMessage="No files for you"
                onFileSelection={jest.fn()}
                selectedFiles={Set<string>()}
                files={FILES_DATA}
            />
        );
        expect(wrapper.find('div.file-listing--header')).toHaveLength(1);
        expect(wrapper.find('div.file-listing--header').text()).toBe('Custom header');
        expect(wrapper).toMatchSnapshot();
    });
    test('with files not deletable', () => {
        const wrapper = shallow(
            <FilesListing
                noFilesMessage="No files for you"
                onFileSelection={jest.fn()}
                selectedFiles={Set<string>()}
                files={FILES_DATA}
            />
        );
        expect(wrapper.find('div.file-listing-row--container')).toHaveLength(FILES_DATA.size);
        expect(wrapper).toMatchSnapshot();
    });
    test('with files deletable', () => {
        const wrapper = shallow(
            <FilesListing
                noFilesMessage="No files for you"
                onFileSelection={jest.fn()}
                canDelete={true}
                onDelete={jest.fn()}
                selectedFiles={Set<string>()}
                files={FILES_DATA}
            />
        );
        expect(wrapper.find('span.file-listing-delete')).toHaveLength(FILES_DATA.size);
        expect(wrapper).toMatchSnapshot();
    });
});
