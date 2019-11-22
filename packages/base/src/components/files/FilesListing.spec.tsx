import * as React from 'react'
import { List } from 'immutable'
import { shallow } from 'enzyme'
import {FilesListing} from "./FilesListing";
import {FILES_DATA} from "../../test/data/constants";
import {IFile} from "./models";

describe("<FilesListing/>", () => {

    test('empty files default props', () => {
        const wrapper = shallow(<FilesListing
            files={List<IFile>()}
        />);
        expect(wrapper).toMatchSnapshot();
    });
    test('empty files custom msg', () => {
        const wrapper = shallow(<FilesListing
            files={List<IFile>()}
            noFilesMessage={'the file list is empty'}
        />);
        expect(wrapper).toMatchSnapshot();
    });
    test('with files default props', () => {
        const wrapper = shallow(<FilesListing
            files={FILES_DATA}
        />);
        expect(wrapper).toMatchSnapshot();
    });
    test('with files custom props', () => {
        const wrapper = shallow(<FilesListing
            files={FILES_DATA}
            addFileText={'add more files'}
            canInsert={true}
            canDelete={true}
            handleUpload={jest.fn()}
            handleDelete={jest.fn()}
            handleDownload={jest.fn()}
        />);
        expect(wrapper).toMatchSnapshot();
    });

});