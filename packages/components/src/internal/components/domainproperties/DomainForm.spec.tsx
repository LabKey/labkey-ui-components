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
import { mount } from 'enzyme';

import { ActionButton } from '../buttons/ActionButton';

import { waitForLifecycle } from '../../test/enzymeTestHelpers';

import { Alert } from '../base/Alert';

import { FileAttachmentForm } from '../../../public/files/FileAttachmentForm';

import { SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS } from '../samples/constants';

import { DomainDesign } from './models';
import DomainForm, { DomainFormImpl } from './DomainForm';
import {
    ATTACHMENT_RANGE_URI,
    BOOLEAN_RANGE_URI,
    DATETIME_RANGE_URI,
    DOMAIN_FIELD_DELETE,
    DOMAIN_FIELD_EXPAND,
    DOMAIN_FIELD_NAME,
    DOMAIN_FIELD_TYPE,
    DOUBLE_RANGE_URI,
    FILELINK_RANGE_URI,
    FLAG_CONCEPT_URI,
    INT_RANGE_URI,
    MULTILINE_RANGE_URI,
    PARTICIPANTID_CONCEPT_URI,
    SAMPLE_TYPE_CONCEPT_URI,
    STRING_RANGE_URI,
} from './constants';
import { createFormInputId } from './utils';
import { clearFieldDetails, updateDomainField } from './actions';

import { DomainRow } from './DomainRow';
import { INT_LIST } from './list/constants';
import { SystemFields } from './SystemFields';
import { getDomainPropertiesTestAPIWrapper } from './APIWrapper';

const API = getDomainPropertiesTestAPIWrapper(jest.fn, {
    getMaxPhiLevel: jest.fn().mockResolvedValue('Restricted'),
});

interface Props {
    hideInferFromFile?: boolean;
    testMode?: boolean;
}

class DomainFormContainer extends React.PureComponent<Props, any> {
    constructor(props: Props) {
        super(props);

        this.state = {
            domain: DomainDesign.create({}),
        };
    }

    onChange = (newDomain: DomainDesign) => {
        this.setState(() => ({
            domain: newDomain,
        }));
    };

    render() {
        return (
            <DomainForm
                api={API}
                domain={this.state.domain}
                domainFormDisplayOptions={{
                    hideInferFromFile: this.props.hideInferFromFile,
                }}
                onChange={this.onChange}
                testMode={this.props.testMode}
            />
        );
    }
}

describe('DomainForm', () => {
    test('with empty domain form', async () => {
        const domain = DomainDesign.create({});

        const form = mount(
            <DomainForm
                api={API}
                domain={domain}
                onChange={jest.fn()}
                domainFormDisplayOptions={{ hideImportExport: true, hideInferFromFile: true }}
                testMode={true}
            />
        );
        await waitForLifecycle(form);

        // Empty panel
        const emptyHdrMsg = form.find({ className: 'domain-form-no-field-panel panel panel-default' });
        expect(emptyHdrMsg.length).toEqual(1);

        // Add button
        const findButton = form.find({ className: 'domain-form-add-btn' }).childAt(0);
        expect(findButton.length).toEqual(1);

        // Search field
        const searchField = form.find({ className: 'form-control', placeholder: 'Search Fields' });
        expect(searchField.length).toEqual(0);

        // Help link
        const helpLink = form.find({
            className: 'domain-field-float-right',
            href: 'https://www.labkey.org/Documentation/wiki-page.view?referrer=inPage&name=fieldEditor',
        });
        expect(helpLink.length).toEqual(1);

        // No Default System Fields
        expect(form.find(SystemFields)).toHaveLength(0);

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('with reservedFieldsMsg', async () => {
        const fields = [];
        fields.push({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });
        fields.push({
            name: 'string',
            rangeURI: STRING_RANGE_URI,
            propertyId: 2,
            propertyURI: 'test',
        });
        const domain = DomainDesign.create({
            name: 'reserved fields msg',
            description: 'description',
            domainURI: 'test',
            domainId: 1,
            fields,
            indices: [],
        });
        const form = mount(<DomainFormImpl api={API} domain={domain} onChange={jest.fn()} testMode={true} />);

        const message = 'There are reserved fields';
        form.setState({ reservedFieldsMsg: message });

        await waitForLifecycle(form);

        expect(form.find(Alert).text()).toBe(message);
        form.unmount();
    });

    test('with showHeader, helpNoun, and helpTopic', async () => {
        const domain = DomainDesign.create({});
        const form = mount(
            <DomainForm
                api={API}
                domain={domain}
                helpNoun="assay"
                helpTopic="assays"
                domainFormDisplayOptions={{
                    hideInferFromFile: true,
                }}
                showHeader={false}
                onChange={jest.fn()}
                testMode={true}
            />
        );
        await waitForLifecycle(form);

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('domain form with no fields', async () => {
        const domain = DomainDesign.create({
            name: 'no fields',
            description: 'no field description',
            domainURI: 'test',
            domainId: 1,
            fields: [],
            indices: [],
        });
        const form = mount(
            <DomainForm
                api={API}
                domain={domain}
                domainFormDisplayOptions={{ hideInferFromFile: true }}
                onChange={jest.fn()}
                testMode={true}
            />
        );
        await waitForLifecycle(form);

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('domain form with all field types', async () => {
        const fields = [];
        fields.push({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });
        fields.push({
            name: 'string',
            rangeURI: STRING_RANGE_URI,
            propertyId: 2,
            propertyURI: 'test',
        });
        fields.push({
            name: 'multiline',
            rangeURI: MULTILINE_RANGE_URI,
            propertyId: 3,
            propertyURI: 'test',
        });
        fields.push({
            name: 'boolean',
            rangeURI: BOOLEAN_RANGE_URI,
            propertyId: 4,
            propertyURI: 'test',
        });
        fields.push({
            name: 'double',
            rangeURI: DOUBLE_RANGE_URI,
            propertyId: 5,
            propertyURI: 'test',
        });
        fields.push({
            name: 'datetime',
            rangeURI: DATETIME_RANGE_URI,
            propertyId: 6,
            propertyURI: 'test',
        });
        fields.push({
            name: 'flag',
            rangeURI: STRING_RANGE_URI,
            conceptURI: FLAG_CONCEPT_URI,
            propertyId: 7,
            propertyURI: 'test',
        });
        fields.push({
            name: 'file link',
            rangeURI: FILELINK_RANGE_URI,
            propertyId: 8,
            propertyURI: 'test',
        });
        fields.push({
            name: 'participant id',
            rangeURI: STRING_RANGE_URI,
            conceptURI: PARTICIPANTID_CONCEPT_URI,
            propertyId: 9,
            propertyURI: 'test',
        });
        fields.push({
            name: 'attachment',
            rangeURI: ATTACHMENT_RANGE_URI,
            propertyId: 10,
            propertyURI: 'test',
        });
        fields.push({
            name: 'sample',
            rangeURI: STRING_RANGE_URI,
            conceptURI: SAMPLE_TYPE_CONCEPT_URI,
            propertyId: 11,
            propertyURI: 'test',
        });

        const domain = DomainDesign.create({
            name: 'all field types',
            description: 'description',
            domainURI: 'test',
            domainId: 1,
            fields,
            indices: [],
        });
        const form = mount(<DomainForm api={API} domain={domain} onChange={jest.fn()} testMode={true} />);
        await waitForLifecycle(form);

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('domain form with updated fields', async () => {
        const fields = [];
        fields.push({
            name: 'fieldname',
            rangeURI: INT_RANGE_URI,
            propertyId: 0,
            propertyURI: 'test',
        });
        fields.push({
            name: 'string changed to boolean',
            rangeURI: STRING_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });
        fields.push({
            name: 'int changed to participant',
            rangeURI: INT_RANGE_URI,
            propertyId: 2,
            propertyURI: 'test',
        });
        fields.push({
            name: 'flag changed to attachment',
            rangeURI: STRING_RANGE_URI,
            conceptURI: FLAG_CONCEPT_URI,
            propertyId: 3,
            propertyURI: 'test',
        });

        let domain = DomainDesign.create({
            name: 'update field types',
            description: 'description',
            domainURI: 'test',
            domainId: 1,
            fields,
            indices: [],
        });

        domain = updateDomainField(domain, { id: createFormInputId(DOMAIN_FIELD_NAME, 0, 0), value: 'newfieldname' });
        domain = updateDomainField(domain, { id: createFormInputId(DOMAIN_FIELD_TYPE, 0, 1), value: 'boolean' });
        domain = updateDomainField(domain, { id: createFormInputId(DOMAIN_FIELD_TYPE, 0, 2), value: 'ParticipantId' });
        domain = updateDomainField(domain, { id: createFormInputId(DOMAIN_FIELD_TYPE, 0, 3), value: 'attachment' });

        const form = mount(<DomainForm api={API} domain={domain} onChange={jest.fn()} testMode={true} />);
        await waitForLifecycle(form);

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('domain form updated field, cleared details', async () => {
        const fields = [];
        fields.push({
            name: 'fieldname',
            rangeURI: INT_RANGE_URI,
            propertyId: 0,
            propertyURI: 'test',
        });

        let domain = DomainDesign.create({
            name: 'update field types',
            description: 'description',
            domainURI: 'test',
            domainId: 1,
            fields,
            indices: [],
            key: 1,
        });

        domain = updateDomainField(domain, { id: createFormInputId(DOMAIN_FIELD_NAME, 0, 0), value: 'newfieldname' });
        domain = clearFieldDetails(domain);

        const form = mount(
            <DomainForm api={API} domain={domain} key="domainForm" onChange={jest.fn()} testMode={true} />
        );
        await waitForLifecycle(form);

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('domain form add, expand, and delete field', async () => {
        const fields = [
            {
                name: 'fieldname',
                rangeURI: INT_RANGE_URI,
                propertyId: 1,
                propertyURI: 'test',
            },
        ];

        const domain = DomainDesign.create({
            name: 'Add/remove field',
            description: 'Add field description',
            domainURI: 'test',
            domainId: 1,
            fields,
            indices: [],
        });

        let updatedDomain;
        const changeHandler = (newDomain, dirty) => {
            updatedDomain = newDomain.merge({
                name: 'updated',
            }) as DomainDesign;
        };

        const form = mount(<DomainForm api={API} domain={domain} onChange={changeHandler} testMode={true} />);
        await waitForLifecycle(form);

        // Add new row
        const findButton = form.find({ className: 'domain-form-add-btn' }).childAt(0);
        expect(findButton.length).toEqual(1);
        findButton.simulate('click');

        // Update state.  This is controlled outside glass component so set it here.
        form.setProps({ domain: updatedDomain, onChange: changeHandler });

        // Check new row is added
        let expandButton = form.find({ id: createFormInputId(DOMAIN_FIELD_EXPAND, 0, 1) }).hostNodes();
        expect(expandButton.length).toEqual(1);

        // Expand first row
        expandButton = form.find({ id: createFormInputId(DOMAIN_FIELD_EXPAND, 0, 0) }).hostNodes();
        expect(expandButton.length).toEqual(1);
        expandButton.simulate('click');

        // Delete first row
        const deleteButton = form.find({ id: createFormInputId(DOMAIN_FIELD_DELETE, 0, 0) }).hostNodes();
        expect(deleteButton.length).toEqual(1);
        deleteButton.simulate('click');
        const confirmButton = form.find('.btn-danger[children="Yes, Remove Field"]');
        confirmButton.simulate('click');

        // Update state.  This is controlled outside glass component so set it here.
        form.setProps({ domain: updatedDomain, onChange: changeHandler });

        // Ensure only one row and expand it
        expandButton = form.find({ id: createFormInputId(DOMAIN_FIELD_EXPAND, 0, 1) }).hostNodes();
        expect(expandButton.length).toEqual(0);
        expandButton = form.find({ id: createFormInputId(DOMAIN_FIELD_EXPAND, 0, 0) }).hostNodes();
        expect(expandButton.length).toEqual(1);
        expandButton.simulate('click');

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('domain form initCollapsed', async () => {
        const domain = DomainDesign.create({
            name: 'collapsed with two fields',
            fields: [
                {
                    name: 'key',
                    rangeURI: INT_RANGE_URI,
                    propertyId: 1,
                    propertyURI: 'test',
                },
                {
                    name: 'string',
                    rangeURI: STRING_RANGE_URI,
                    propertyId: 2,
                    propertyURI: 'test',
                },
            ],
        });

        const form = mount(
            <DomainForm
                api={API}
                domain={domain}
                collapsible={false}
                initCollapsed={true}
                onChange={jest.fn()}
                testMode={true}
            />
        );
        await waitForLifecycle(form);

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('domain form initCollapsed and markComplete', async () => {
        const domain = DomainDesign.create({
            name: 'collapsed and markComplete',
            fields: [
                {
                    name: 'key',
                    rangeURI: INT_RANGE_URI,
                    propertyId: 1,
                    propertyURI: 'test',
                },
                {
                    name: 'string',
                    rangeURI: STRING_RANGE_URI,
                    propertyId: 2,
                    propertyURI: 'test',
                },
            ],
        });

        const form = mount(
            <DomainForm
                api={API}
                domain={domain}
                collapsible={false}
                initCollapsed={true}
                onChange={jest.fn()}
                testMode={true}
            />
        );
        await waitForLifecycle(form);

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('domain form headerPrefix and panelCls', async () => {
        const domain = DomainDesign.create({ name: 'Foo headerPrefix and panelCls' });

        const form = mount(
            <DomainForm
                api={API}
                domain={domain}
                domainFormDisplayOptions={{
                    hideInferFromFile: true,
                }}
                collapsible={false}
                initCollapsed={true}
                headerPrefix="Foo" // this text should be removed from the panel header display text
                onChange={jest.fn()}
                testMode={true}
            />
        );
        await waitForLifecycle(form);

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('with hideInferFromFile false', async () => {
        const domain = DomainDesign.create({});
        const form = mount(
            <DomainForm
                api={API}
                domain={domain}
                domainFormDisplayOptions={{ hideInferFromFile: false }}
                onChange={jest.fn()}
                testMode={true}
            />
        );
        await waitForLifecycle(form);

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('hideInferFromFile false click domain-form-manual-btn', async () => {
        const component = <DomainFormContainer hideInferFromFile={false} testMode={true} />;
        const wrapper = mount(component);
        await waitForLifecycle(wrapper);

        expect(wrapper.find(FileAttachmentForm)).toHaveLength(1);
        expect(wrapper.find('.domain-form-manual-btn')).toHaveLength(1);
        wrapper.find('.domain-form-manual-btn>span').simulate('click');
        expect(wrapper.find(FileAttachmentForm)).toHaveLength(0);
        expect(wrapper.find('.domain-form-manual-btn')).toHaveLength(0);
        expect(wrapper.find(DomainRow)).toHaveLength(1);
        wrapper.unmount();
    });

    test('domain form header and search', async () => {
        const fields = [];
        fields.push({
            name: 'abc_fieldname',
            rangeURI: INT_RANGE_URI,
            propertyId: 0,
            propertyURI: 'test',
        });
        fields.push({
            name: 'ab_fieldname',
            rangeURI: STRING_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });
        fields.push({
            name: 'abcd_fieldname',
            rangeURI: INT_RANGE_URI,
            propertyId: 2,
            propertyURI: 'test',
        });
        fields.push({
            name: 'fieldname_abcd',
            rangeURI: STRING_RANGE_URI,
            conceptURI: FLAG_CONCEPT_URI,
            propertyId: 3,
            propertyURI: 'test',
        });

        const domain = DomainDesign.create({
            name: 'Search Domain',
            description: 'description',
            domainURI: 'test',
            domainId: 1,
            fields,
            indices: [],
        });

        let updatedDomain;
        const changeHandler = (newDomain, dirty) => {
            updatedDomain = newDomain.merge({
                name: 'updated',
            }) as DomainDesign;
        };

        const helpTopic = 'Your topic';
        const form = mount(
            <DomainForm api={API} helpTopic={helpTopic} domain={domain} onChange={changeHandler} testMode={true} />
        );
        await waitForLifecycle(form);

        // Check help link
        const helpLink = form.find('a.domain-field-float-right');
        expect(helpLink.length).toEqual(1);

        // Search field test
        const searchField = form.find({ className: 'domain-search-input' });
        expect(searchField.length).toEqual(1);
        searchField.props().onChange({ target: { value: 'abcd' } });

        // Update state.  This is controlled outside glass component so set it here.
        form.setProps({ domain: updatedDomain, onChange: changeHandler });

        let filteredFields = form.find({ className: 'domain-field-row domain-row-border-default' });
        expect(filteredFields.length).toEqual(2);

        searchField.props().onChange({ target: { value: 'abc' } });
        form.setProps({ domain: updatedDomain, onChange: changeHandler });
        filteredFields = form.find({ className: 'domain-field-row domain-row-border-default' });
        expect(filteredFields.length).toEqual(3);

        searchField.props().onChange({ target: { value: '' } });
        form.setProps({ domain: updatedDomain, onChange: changeHandler });
        filteredFields = form.find({ className: 'domain-field-row domain-row-border-default' });
        expect(filteredFields.length).toEqual(4);

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('domain form no file or attachment type', async () => {
        const domain = DomainDesign.create({
            name: 'Domain Name',
            description: 'description',
            domainURI: 'test',
            domainId: 1,
            fields: [],
            allowFileLinkProperties: false,
            allowAttachmentProperties: false,
            allowFlagProperties: false,
            showDefaultValueSettings: true,
            indices: [],
        });

        let updatedDomain;
        const changeHandler = (newDomain, dirty) => {
            updatedDomain = newDomain.merge({
                name: 'updated',
            }) as DomainDesign;
        };

        const form = mount(
            <DomainForm
                api={API}
                domain={domain}
                onChange={changeHandler}
                domainFormDisplayOptions={{ hideImportExport: true, hideInferFromFile: true }}
                testMode={true}
            />
        );
        await waitForLifecycle(form);

        // Add new row
        const findButton = form.find({ className: 'domain-form-add-btn' }).childAt(0);
        expect(findButton.length).toEqual(1);
        findButton.simulate('click');

        // Update state.  This is controlled outside glass component so set it here.
        form.setProps({ domain: updatedDomain, onChange: changeHandler });

        // Get type field and verify available options
        const typeField = form.find({ id: createFormInputId(DOMAIN_FIELD_TYPE, 0, 0), className: 'form-control' });
        expect(typeField.length).toEqual(1);
        expect(typeField.children().length).toEqual(11); // Check number of options
        expect(typeField.find({ value: 'int' }).length).toEqual(1); // sanity check
        expect(typeField.find({ value: 'flag' }).length).toEqual(0);
        expect(typeField.find({ value: 'fileLink' }).length).toEqual(0);
        expect(typeField.find({ value: 'attachment' }).length).toEqual(0);
        expect(typeField.find({ value: 'ontologyLookup' }).length).toEqual(0);

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('header click for expand and collapse', async () => {
        const name = 'header click';
        const domain = DomainDesign.create({
            name,
            fields: [
                {
                    name: 'key',
                    rangeURI: INT_RANGE_URI,
                    propertyId: 1,
                    propertyURI: 'test',
                },
            ],
        });

        const wrapper = mount(
            <DomainForm api={API} domain={domain} onChange={jest.fn} collapsible controlledCollapse testMode />
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find('.domain-panel-header-expanded').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.domain-panel-header-collapsed').hostNodes()).toHaveLength(0);
        expect(wrapper.find('.domain-panel-header').text()).toBe(name + '1 Field Defined');

        // first click will collapse the panel, but header text shouldn't change
        wrapper.find('.domain-panel-header').simulate('click');
        expect(wrapper.find('.domain-panel-header-expanded').hostNodes()).toHaveLength(0);
        expect(wrapper.find('.domain-panel-header-collapsed').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.domain-panel-header').text()).toBe(name + '1 Field Defined');

        // second click will re-expand the panel, but header text shouldn't change
        wrapper.find('.domain-panel-header').simulate('click');
        expect(wrapper.find('.domain-panel-header-expanded').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.domain-panel-header-collapsed').hostNodes()).toHaveLength(0);
        expect(wrapper.find('.domain-panel-header').text()).toBe(name + '1 Field Defined');
        wrapper.unmount();
    });

    test('Show app header', async () => {
        const name = 'header click';
        const domain = DomainDesign.create({
            name,
            fields: [
                {
                    name: 'key',
                    rangeURI: INT_RANGE_URI,
                    propertyId: 1,
                    propertyURI: 'test',
                },
            ],
        });

        const _headerId = 'mock-app-header';
        const _headerText = 'This is a mock app header';

        const mockAppHeader = jest.fn();
        mockAppHeader.mockReturnValue(
            <>
                <div id={_headerId}>{_headerText}</div>
            </>
        );

        const wrapper = mount(
            <DomainForm
                api={API}
                domain={domain}
                onChange={jest.fn}
                collapsible={true}
                appDomainHeaderRenderer={mockAppHeader}
                testMode={true}
            />
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find(DomainRow)).toHaveLength(1);
        expect(wrapper.find('#' + _headerId).text()).toBe(_headerText);
        wrapper.unmount();
    });

    test('domain form with hide required', async () => {
        const fields = [];
        fields.push({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });

        const domain = DomainDesign.create({
            name: 'Hide required',
            description: 'domain form with no required fields',
            domainURI: 'test',
            domainId: 1,
            fields,
            indices: [],
        });

        const form = mount(
            <DomainForm
                api={API}
                domain={domain}
                onChange={jest.fn()}
                domainFormDisplayOptions={{
                    hideRequired: true,
                }}
                testMode={true}
            />
        );
        await waitForLifecycle(form);

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('domain form with hide add fields button', async () => {
        const domain = DomainDesign.create({});

        const form = mount(
            <DomainForm
                api={API}
                domain={domain}
                onChange={jest.fn()}
                domainFormDisplayOptions={{
                    hideAddFieldsButton: true,
                    hideInferFromFile: true,
                }}
                testMode={true}
            />
        );
        await waitForLifecycle(form);

        // Add button
        const findButton = form.find({ className: 'domain-form-add-btn' });
        expect(findButton.length).toEqual(0);

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('using default false for hideImportExport', async () => {
        const domain = DomainDesign.create({});

        const form = mount(<DomainForm api={API} domain={domain} onChange={jest.fn()} testMode={true} />);

        await waitForLifecycle(form);

        expect(form.find('.domain-form-manual-section').length).toEqual(1);
        expect(form.find('.file-form-formats').text()).toContain('.json');
        expect(form.find('.domain-toolbar-export-btn').length).toEqual(0);
        expect(form.find('.domain-field-top-noBuffer').length).toEqual(0);

        form.unmount();
    });

    test('using hideImportExport', async () => {
        const domain = DomainDesign.create({});

        const form = mount(
            <DomainForm
                api={API}
                domain={domain}
                onChange={jest.fn()}
                domainFormDisplayOptions={{
                    hideInferFromFile: true,
                    hideImportExport: true,
                }}
                testMode={true}
            />
        );

        await waitForLifecycle(form);

        expect(form.find('.domain-form-manual-section').length).toEqual(0);
        expect(form.find('.file-form-formats').length).toEqual(0);
        expect(form.find('.domain-toolbar-export-btn').length).toEqual(0);
        expect(form.find('.domain-field-top-noBuffer').length).toEqual(2);

        form.unmount();
    });

    test('using default for hideImportExport, field view', async () => {
        const fields = [];
        fields.push({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });

        const domain = DomainDesign.create({
            name: 'default hideImportExport false field view',
            description: 'basic list domain form',
            domainURI: 'test',
            domainId: 1,
            fields,
            indices: [],
        });

        const form = mount(
            <DomainForm
                api={API}
                domain={domain}
                onChange={jest.fn()}
                domainFormDisplayOptions={{
                    hideRequired: true,
                }}
                testMode={true}
            />
        );

        await waitForLifecycle(form);

        expect(form.find('.domain-toolbar-export-btn').length).toEqual(1);
        expect(form.find('.domain-field-top-noBuffer').length).toEqual(2);

        const actionButtons = form.find(ActionButton);
        expect(actionButtons.length).toBe(4);
        expect(actionButtons.at(2).prop('disabled')).toBe(false); // export button

        form.unmount();
    });

    test('using hideImportExport, field view', async () => {
        const fields = [];
        fields.push({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });

        const domain = DomainDesign.create({
            name: 'hideImportExport field view',
            description: 'basic list domain form',
            domainURI: 'test',
            domainId: 1,
            fields,
            indices: [],
        });

        const form = mount(
            <DomainForm
                api={API}
                domain={domain}
                onChange={jest.fn()}
                domainFormDisplayOptions={{
                    hideRequired: true,
                    hideImportExport: true,
                }}
                testMode={true}
            />
        );

        await waitForLifecycle(form);

        expect(form.find('.domain-toolbar-export-btn').length).toEqual(0);
        expect(form.find('.domain-field-top-noBuffer').length).toEqual(2);

        const actionButtons = form.find(ActionButton);
        expect(actionButtons.length).toBe(3);

        form.unmount();
    });

    test('with bulkDeleteConfirmInfo', async () => {
        const fields = [];
        fields.push({ name: 'UndeletableField' });
        fields.push({ name: 'DeletableField1' });
        fields.push({ name: 'DeletableField2' });
        const domain = DomainDesign.create({ fields });
        const form = mount(<DomainFormImpl api={API} domain={domain} onChange={jest.fn()} testMode={true} />);

        await waitForLifecycle(form);

        expect(form.find('.modal-title').length).toEqual(0);
        form.setState({ bulkDeleteConfirmInfo: { deletableSelectedFields: [1, 2], undeletableFields: [0] } });
        expect(form.find('.modal-title').length).toEqual(1);
        expect(form.text()).toContain('UndeletableField cannot be deleted as it is a necessary field.');
        expect(form.text()).toContain('2 of 3 fields will be deleted.');

        form.setState({ bulkDeleteConfirmInfo: { deletableSelectedFields: [1, 2], undeletableFields: [] } });
        expect(form.text()).toContain('2 fields will be deleted.');

        form.setState({ bulkDeleteConfirmInfo: { deletableSelectedFields: [1], undeletableFields: [] } });
        expect(form.text()).toContain('1 field will be deleted.');

        form.setState({ bulkDeleteConfirmInfo: { deletableSelectedFields: [], undeletableFields: [0] } });
        expect(form.text()).toContain('None of the selected fields can be deleted.');

        form.unmount();
    });

    test('with visibleFieldsCount and visibleSelection', async () => {
        const fields = [];
        fields.push({ name: 'Field1' });
        fields.push({ name: 'Field2' });
        const domain = DomainDesign.create({ fields });
        const form = mount(<DomainFormImpl api={API} domain={domain} onChange={jest.fn()} testMode={true} />);

        const visibleSelection = new Set();
        visibleSelection.add(0).add(1);

        await waitForLifecycle(form);

        form.setState({ visibleFieldsCount: 2, visibleSelection });
        expect(form.find('.domain-panel-header-clear-all').get(0).props.disabled).toBeFalsy();
        expect(form.find('.domain-toolbar-delete-btn').closest(ActionButton).props().disabled).toBeFalsy();
        expect(form.text()).toContain('2 fields selected');
        expect(form.text()).toContain('Clear All');

        const visibleSelectionNew = new Set();
        visibleSelectionNew.add(0);
        form.setState({ visibleFieldsCount: 2, visibleSelection: visibleSelectionNew });
        expect(form.find('.domain-panel-header-clear-all').get(0).props.disabled).toBeFalsy();
        expect(form.find('.domain-toolbar-delete-btn').closest(ActionButton).props().disabled).toBeFalsy();
        expect(form.text()).toContain('1 field selected');
        expect(form.text()).toContain('Clear');

        form.setState({ visibleFieldsCount: 2, visibleSelection: new Set() });
        expect(form.find('.domain-panel-header-clear-all').get(0).props.disabled).toBeTruthy();
        expect(form.find('.domain-toolbar-delete-btn').closest(ActionButton).props().disabled).toBeTruthy();
        expect(form.text()).toContain('0 fields selected');
        expect(form.text()).toContain('Clear');

        form.unmount();
    });

    test('with summaryViewMode', async () => {
        const fields = [];
        fields.push({ name: 'Field0' });
        fields.push({ name: 'Field1' });
        fields.push({ name: 'Field2' });

        const domain = DomainDesign.create({ fields });
        const form = mount(<DomainFormImpl api={API} domain={domain} onChange={jest.fn()} testMode={true} />);

        await waitForLifecycle(form);

        expect(form.find('.domain-field-row').length).toEqual(4);
        expect(form.find('.table-responsive').length).toEqual(0);
        expect(form.find('.domain-field-toolbar').length).toEqual(2);

        form.setState({ summaryViewMode: true });

        expect(form.find('.domain-field-row').length).toEqual(0);
        expect(form.find('.table-responsive').length).toEqual(1);
        expect(form.find('.domain-field-toolbar').length).toEqual(2);
        expect(form.text()).not.toContain('Is Primary Key');
    });

    // 'Is Primary Key' column should only render on List domains
    test('with summaryViewMode isPrimaryKey column, VarList', async () => {
        const fields = [];
        fields.push({ name: 'Field0' });
        fields.push({ name: 'Field1' });
        fields.push({ name: 'Field2' });

        const domain = DomainDesign.create({ fields, domainKindName: 'VarList' });
        const form = mount(<DomainFormImpl api={API} domain={domain} onChange={jest.fn()} testMode={true} />);

        await waitForLifecycle(form);

        form.setState({ summaryViewMode: true });

        expect(form.text()).toContain('Is Primary Key');
    });

    test('with summaryViewMode isPrimaryKey column, IntList', async () => {
        const fields = [];
        fields.push({ name: 'Field0' });
        fields.push({ name: 'Field1' });
        fields.push({ name: 'Field2' });

        const domain = DomainDesign.create({ fields, domainKindName: INT_LIST });
        const form = mount(<DomainFormImpl api={API} domain={domain} onChange={jest.fn()} testMode={true} />);

        await waitForLifecycle(form);

        form.setState({ summaryViewMode: true });

        expect(form.text()).toContain('Is Primary Key');
    });

    test('with systemFields', async () => {
        const domain = DomainDesign.create({});
        const form = mount(
            <DomainFormImpl
                api={API}
                domain={domain}
                onChange={jest.fn()}
                systemFields={SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS}
                testMode={true}
            />
        );

        await waitForLifecycle(form);

        expect(form.find(SystemFields)).toHaveLength(1);
    });
});
