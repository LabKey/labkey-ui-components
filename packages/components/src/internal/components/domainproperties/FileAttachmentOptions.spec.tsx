import React from 'react';
import { mount } from 'enzyme';

import {
    DOMAIN_FIELD_FILE_DISPLAY,
    DOMAIN_FIELD_NOT_LOCKED,
    FILE_DISPLAY_ATTACHMENT,
    FILE_DISPLAY_INLINE,
} from './constants';
import { createFormInputId } from './utils';
import { FileAttachmentOptions } from './FileAttachmentOptions';

describe('FileAttachmentOptions', () => {
    test('File data type inline', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: 'File',
            displayOption: FILE_DISPLAY_INLINE,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
        };

        const fileOptions = mount(<FileAttachmentOptions {...props} />);

        // Verify label
        const sectionLabel = fileOptions.find({ className: 'domain-field-section-heading' });
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual('File Behavior');

        // Test file behavior initial value
        let displayField = fileOptions.find({
            id: createFormInputId(DOMAIN_FIELD_FILE_DISPLAY, 1, 1),
            className: 'form-control',
        });
        expect(displayField.length).toEqual(1);
        expect(displayField.props().value).toEqual(FILE_DISPLAY_INLINE);

        // Verify options
        expect(displayField.childAt(0).text()).toEqual('Show File in Browser');
        expect(displayField.childAt(1).text()).toEqual('Download File');

        // Verify file display value changes with props
        fileOptions.setProps({ displayOption: FILE_DISPLAY_ATTACHMENT });
        displayField = fileOptions.find({
            id: createFormInputId(DOMAIN_FIELD_FILE_DISPLAY, 1, 1),
            className: 'form-control',
        });
        expect(displayField.props().value).toEqual(FILE_DISPLAY_ATTACHMENT);

        expect(fileOptions).toMatchSnapshot();
        fileOptions.unmount();
    });

    test('Attachment data type download', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: 'Attachment',
            displayOption: FILE_DISPLAY_ATTACHMENT,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
        };

        const fileOptions = mount(<FileAttachmentOptions {...props} />);

        // Verify label
        const sectionLabel = fileOptions.find({ className: 'domain-field-section-heading' });
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual('Attachment Behavior');

        // Test file behavior initial value
        const displayField = fileOptions.find({
            id: createFormInputId(DOMAIN_FIELD_FILE_DISPLAY, 1, 1),
            className: 'form-control',
        });
        expect(displayField.length).toEqual(1);
        expect(displayField.props().value).toEqual(FILE_DISPLAY_ATTACHMENT);

        // Verify options
        expect(displayField.childAt(0).text()).toEqual('Show Attachment in Browser');
        expect(displayField.childAt(1).text()).toEqual('Download Attachment');

        expect(fileOptions).toMatchSnapshot();
        fileOptions.unmount();
    });
});
