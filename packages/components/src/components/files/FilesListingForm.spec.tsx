import React from 'react';
import { List } from 'immutable';
import { shallow } from 'enzyme';

import { FILES_DATA, FILES_DATA_2 } from '../../test/data/constants';

import { FilesListingForm } from './FilesListingForm';

import { IFile } from './models';

describe('<FilesListingForm/>', () => {
    test('empty files default props', () => {
        const wrapper = shallow(<FilesListingForm files={List<IFile>()} />);
        expect(wrapper).toMatchSnapshot();
    });
    test('empty files custom msg', () => {
        const wrapper = shallow(<FilesListingForm files={List<IFile>()} noFilesMessage="the file list is empty" />);
        expect(wrapper).toMatchSnapshot();
    });
    test('with files default props', () => {
        const wrapper = shallow(<FilesListingForm files={FILES_DATA} />);
        expect(wrapper).toMatchSnapshot();
    });
    test('with files custom props', () => {
        const wrapper = shallow(
            <FilesListingForm
                files={FILES_DATA}
                addFileText="add more files"
                noFilesMessage="No files currently attached."
                canInsert={true}
                canDelete={true}
                handleUpload={jest.fn()}
                handleDelete={jest.fn()}
                handleDownload={jest.fn()}
            />
        );
        expect(wrapper).toMatchSnapshot();
    });
    test('with only readOnly files', () => {
        const wrapper = shallow(<FilesListingForm readOnlyFiles={FILES_DATA} readOnlyHeaderText="Read-only files" />);
        expect(wrapper).toMatchSnapshot();
    });
    test('with readOnly and editable files', () => {
        const wrapper = shallow(
            <FilesListingForm
                files={FILES_DATA}
                readOnlyFiles={FILES_DATA_2}
                headerText="Your files"
                readOnlyHeaderText={"Other files you can't remove"}
                noFilesMessage="No files for you!"
                noReadOnlyFilesMessage="No other files for you either!"
                addFileText="more files"
                canInsert={true}
                canDelete={true}
                handleUpload={jest.fn()}
                handleDelete={jest.fn()}
                handleDownload={jest.fn()}
            />
        );
        expect(wrapper).toMatchSnapshot();
    });
    test('with readOnly and noFilesMessage', () => {
        const wrapper = shallow(
            <FilesListingForm
                readOnlyFiles={FILES_DATA_2}
                headerText="Your files"
                readOnlyHeaderText={"Other files you can't remove"}
                noFilesMessage="No files for you!"
                noReadOnlyFilesMessage="No other files for you either!"
                addFileText="more files"
                canInsert={true}
                canDelete={true}
                handleUpload={jest.fn()}
                handleDelete={jest.fn()}
                handleDownload={jest.fn()}
            />
        );
        expect(wrapper).toMatchSnapshot();
    });
    test('with editable and noReadOnlyFilesMessage', () => {
        const wrapper = shallow(
            <FilesListingForm
                files={FILES_DATA}
                headerText="Your files"
                readOnlyHeaderText={"Other files you can't remove"}
                noFilesMessage="No files for you!"
                noReadOnlyFilesMessage="No other files for you either!"
                addFileText="more files"
                canInsert={true}
                canDelete={true}
                handleUpload={jest.fn()}
                handleDelete={jest.fn()}
                handleDownload={jest.fn()}
            />
        );
        expect(wrapper).toMatchSnapshot();
    });
    test('with no files and both messages', () => {
        const wrapper = shallow(
            <FilesListingForm
                headerText="Your files"
                readOnlyHeaderText={"Other files you can't remove"}
                noFilesMessage="No files for you!"
                noReadOnlyFilesMessage="No other files for you either!"
                addFileText="more files"
                canInsert={true}
                canDelete={true}
                handleUpload={jest.fn()}
                handleDelete={jest.fn()}
                handleDownload={jest.fn()}
            />
        );
        expect(wrapper).toMatchSnapshot();
    });
});
