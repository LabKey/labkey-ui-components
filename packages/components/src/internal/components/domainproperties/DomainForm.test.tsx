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
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS } from '../samples/constants';

import { DomainDesign } from './models';
import DomainForm, { DomainFormImpl } from './DomainForm';
import {
    ATTACHMENT_RANGE_URI,
    BOOLEAN_RANGE_URI,
    DATETIME_RANGE_URI,
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

import { INT_LIST } from './list/constants';
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

        let container;
        await act(async () => {
            container = renderWithAppContext(
                <DomainForm
                    api={API}
                    domain={domain}
                    onChange={jest.fn()}
                    domainFormDisplayOptions={{ hideImportExport: true, hideInferFromFile: true }}
                    testMode={true}
                />
            );
        });

        // Empty panel
        expect(document.getElementsByClassName('domain-form-no-field-panel')).toHaveLength(1);

        // Add button
        expect(document.getElementsByClassName('domain-form-add-btn')).toHaveLength(1);

        // Search field
        expect(document.getElementById('domain-search-input')).toBeNull();

        // Help link
        const help = document.querySelector('div.domain-form-hdr-margins a');
        expect(help.textContent).toBe('Learn more about this tool');
        expect(help.getAttribute('href')).toBe(
            'https://www.labkey.org/Documentation/wiki-page.view?referrer=inPage&name=fieldEditor'
        );

        // No system fields
        expect(document.getElementsByClassName('domain-system-fields')).toHaveLength(0);
    });

    test('with showHeader, helpNoun, and helpTopic', async () => {
        const domain = DomainDesign.create({});

        let container;
        await act(async () => {
            container = renderWithAppContext(
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
        });

        expect(container).toMatchSnapshot();
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

        let container;
        await act(async () => {
            container = renderWithAppContext(
                <DomainForm
                    api={API}
                    domain={domain}
                    domainFormDisplayOptions={{ hideInferFromFile: true }}
                    onChange={jest.fn()}
                    testMode={true}
                />
            );
        });

        expect(container).toMatchSnapshot();
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

        let container;
        await act(async () => {
            container = renderWithAppContext(
                <DomainForm api={API} domain={domain} onChange={jest.fn()} testMode={true} />
            );
        });

        expect(container).toMatchSnapshot();
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

        let container;
        await act(async () => {
            container = renderWithAppContext(
                <DomainForm api={API} domain={domain} onChange={jest.fn()} testMode={true} />
            );
        });

        expect(container).toMatchSnapshot();
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

        let container;
        await act(async () => {
            container = renderWithAppContext(
                <DomainForm api={API} domain={domain} key="domainForm" onChange={jest.fn()} testMode={true} />
            );
        });

        expect(container).toMatchSnapshot();
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

        await act(async () => {
            renderWithAppContext(
                <DomainForm
                    api={API}
                    domain={domain}
                    collapsible={false}
                    initCollapsed={true}
                    onChange={jest.fn()}
                    testMode={true}
                />
            );
        });

        expect(document.getElementsByClassName('domain-panel-header-collapsed')).toHaveLength(1);
        expect(document.getElementsByClassName('domain-panel-status-icon-green')).toHaveLength(0);
        expect(document.getElementsByClassName('domain-panel-status-icon-blue')).toHaveLength(0);
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

        await act(async () => {
            renderWithAppContext(
                <DomainForm
                    api={API}
                    domain={domain}
                    collapsible={false}
                    initCollapsed={true}
                    onChange={jest.fn()}
                    testMode={true}
                    panelStatus="COMPLETE"
                />
            );
        });

        expect(document.getElementsByClassName('domain-panel-header-collapsed')).toHaveLength(1);
        expect(document.getElementsByClassName('domain-panel-status-icon-green')).toHaveLength(1);
        expect(document.getElementsByClassName('domain-panel-status-icon-blue')).toHaveLength(0);
    });

    test('domain form headerPrefix', async () => {
        const domain = DomainDesign.create({ name: 'Foo headerPrefix' });

        await act(async () => {
            renderWithAppContext(
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
        });

        const panelTitles = document.getElementsByClassName('domain-panel-title');
        expect(panelTitles).toHaveLength(1);
        expect(panelTitles[0].textContent).toBe('headerPrefix');
    });

    test('with hideInferFromFile false', async () => {
        const domain = DomainDesign.create({});

        await act(async () => {
            renderWithAppContext(
                <DomainForm
                    api={API}
                    domain={domain}
                    domainFormDisplayOptions={{ hideInferFromFile: false }}
                    onChange={jest.fn()}
                    testMode={true}
                />
            );
        });

        expect(document.getElementsByClassName('domain-form-no-field-panel')).toHaveLength(0);
        expect(document.getElementsByClassName('translator--toggle__wizard')).toHaveLength(1);
    });

    test('with hideImportExport false', async () => {
        const domain = DomainDesign.create({});

        await act(async () => {
            renderWithAppContext(
                <DomainForm
                    api={API}
                    domain={domain}
                    domainFormDisplayOptions={{ hideInferFromFile: false }}
                    onChange={jest.fn()}
                    testMode={true}
                />
            );
        });

        expect(document.getElementsByClassName('domain-form-no-field-panel')).toHaveLength(0);
        expect(document.getElementsByClassName('translator--toggle__wizard')).toHaveLength(1);
    });

    test('with hideInferFromFile true and hideImportExport true', async () => {
        const domain = DomainDesign.create({});

        await act(async () => {
            renderWithAppContext(
                <DomainForm
                    api={API}
                    domain={domain}
                    domainFormDisplayOptions={{ hideInferFromFile: true, hideImportExport: true }}
                    onChange={jest.fn()}
                    testMode={true}
                />
            );
        });

        expect(document.getElementsByClassName('domain-form-no-field-panel')).toHaveLength(1);
        expect(document.getElementsByClassName('translator--toggle__wizard')).toHaveLength(0);

        expect(document.getElementsByClassName('domain-form-manual-section').length).toEqual(0);
        expect(document.getElementsByClassName('file-form-formats').length).toEqual(0);
        expect(document.getElementsByClassName('domain-toolbar-export-btn').length).toEqual(0);
        expect(document.getElementsByClassName('domain-field-top-noBuffer').length).toEqual(1);
    });

    test('hideInferFromFile false click domain-form-manual-btn', async () => {
        await act(async () => {
            renderWithAppContext(<DomainFormContainer hideInferFromFile={false} testMode={true} />);
        });

        expect(document.getElementsByClassName('translator--toggle__wizard')).toHaveLength(1);
        expect(document.getElementsByClassName('domain-form-manual-btn')).toHaveLength(1);
        expect(document.getElementsByClassName('domain-field-row')).toHaveLength(0);
        await act(async () => {
            userEvent.click(document.querySelector('.domain-form-manual-btn>span'));
        });
        expect(document.getElementsByClassName('translator--toggle__wizard')).toHaveLength(0);
        expect(document.getElementsByClassName('domain-form-manual-btn')).toHaveLength(0);
        expect(document.getElementsByClassName('domain-floating-hdr')).toHaveLength(1);
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

        await act(async () => {
            renderWithAppContext(
                <DomainForm api={API} domain={domain} onChange={jest.fn} collapsible controlledCollapse testMode />
            );
        });

        expect(document.getElementsByClassName('domain-panel-header-expanded')).toHaveLength(1);
        expect(document.getElementsByClassName('domain-panel-header-collapsed')).toHaveLength(0);
        expect(document.getElementsByClassName('domain-panel-header')[0].textContent).toBe(name + '1 Field Defined');

        // first click will collapse the panel, but header text shouldn't change
        await act(async () => {
            userEvent.click(document.querySelector('.domain-panel-header'));
        });
        expect(document.getElementsByClassName('domain-panel-header-expanded')).toHaveLength(0);
        expect(document.getElementsByClassName('domain-panel-header-collapsed')).toHaveLength(1);
        expect(document.getElementsByClassName('domain-panel-header')[0].textContent).toBe(name + '1 Field Defined');

        // second click will re-expand the panel, but header text shouldn't change
        await act(async () => {
            userEvent.click(document.querySelector('.domain-panel-header'));
        });
        expect(document.getElementsByClassName('domain-panel-header-expanded')).toHaveLength(1);
        expect(document.getElementsByClassName('domain-panel-header-collapsed')).toHaveLength(0);
        expect(document.getElementsByClassName('domain-panel-header')[0].textContent).toBe(name + '1 Field Defined');
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

        await act(async () => {
            renderWithAppContext(
                <DomainForm
                    api={API}
                    domain={domain}
                    onChange={jest.fn}
                    collapsible={true}
                    appDomainHeaderRenderer={mockAppHeader}
                    testMode={true}
                />
            );
        });

        expect(document.getElementsByClassName('domain-floating-hdr')).toHaveLength(1);
        expect(document.querySelector('#' + _headerId).textContent).toBe(_headerText);
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

        await act(async () => {
            renderWithAppContext(
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
        });

        const rows = document.getElementsByClassName('domain-row-container');
        expect(rows[0].textContent).toBe('Name *Data Type *Details'); // no Required
    });

    test('domain form with hide add fields button', async () => {
        const domain = DomainDesign.create({});

        await act(async () => {
            renderWithAppContext(
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
        });

        // Add button
        expect(document.getElementsByClassName('domain-form-add-btn')).toHaveLength(0);
    });

    test('using default false for hideImportExport', async () => {
        const domain = DomainDesign.create({});

        await act(async () => {
            renderWithAppContext(<DomainForm api={API} domain={domain} onChange={jest.fn()} testMode={true} />);
        });

        expect(document.getElementsByClassName('domain-form-manual-section').length).toEqual(1);
        expect(document.querySelector('.file-form-formats').textContent).toContain('.json');
        expect(document.getElementsByClassName('domain-toolbar-export-btn').length).toEqual(0);
        expect(document.getElementsByClassName('domain-field-top-noBuffer').length).toEqual(0);
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

        await act(async () => {
            renderWithAppContext(
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
        });

        expect(document.getElementsByClassName('domain-toolbar-export-btn').length).toEqual(1);
        expect(document.getElementsByClassName('domain-field-top-noBuffer').length).toEqual(1);

        const actionButtons = document.getElementsByClassName('container--action-button');
        expect(actionButtons.length).toBe(4);
        expect(actionButtons[2].getAttribute('disabled')).toBeNull(); // export button
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

        await act(async () => {
            renderWithAppContext(
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
        });

        expect(document.getElementsByClassName('domain-toolbar-export-btn').length).toEqual(0);
        expect(document.getElementsByClassName('domain-field-top-noBuffer').length).toEqual(1);

        const actionButtons = document.getElementsByClassName('container--action-button');
        expect(actionButtons.length).toBe(3);
    });

    test('with summaryViewMode', async () => {
        const fields = [];
        fields.push({ name: 'Field0' });
        fields.push({ name: 'Field1' });
        fields.push({ name: 'Field2' });

        const domain = DomainDesign.create({ fields });

        await act(async () => {
            renderWithAppContext(<DomainFormImpl api={API} domain={domain} onChange={jest.fn()} testMode={false} />);
        });

        expect(document.getElementsByClassName('domain-field-row').length).toEqual(4);
        expect(document.getElementsByClassName('table-responsive').length).toEqual(0);
        expect(document.getElementsByClassName('domain-field-toolbar').length).toEqual(1);

        await act(async () => {
            const toggles = document.getElementsByClassName('toggle')[0].getElementsByClassName('btn');
            userEvent.click(toggles[0]);
        });

        expect(document.getElementsByClassName('domain-field-row').length).toEqual(0);
        expect(document.getElementsByClassName('table-responsive').length).toEqual(1);
        expect(document.getElementsByClassName('domain-field-toolbar').length).toEqual(1);
        expect(document.querySelector('.table-responsive').textContent.indexOf('Is Primary Key')).toBe(-1);
    });

    // 'Is Primary Key' column should only render on List domains
    test('with summaryViewMode isPrimaryKey column, VarList', async () => {
        const fields = [];
        fields.push({ name: 'Field0' });
        fields.push({ name: 'Field1' });
        fields.push({ name: 'Field2' });

        const domain = DomainDesign.create({ fields, domainKindName: 'VarList' });
        await act(async () => {
            renderWithAppContext(<DomainFormImpl api={API} domain={domain} onChange={jest.fn()} testMode={false} />);
        });

        await act(async () => {
            const toggles = document.getElementsByClassName('toggle')[0].getElementsByClassName('btn');
            userEvent.click(toggles[0]);
        });

        expect(document.querySelector('.table-responsive').textContent).toContain('Is Primary Key');
    });

    test('with summaryViewMode isPrimaryKey column, IntList', async () => {
        const fields = [];
        fields.push({ name: 'Field0' });
        fields.push({ name: 'Field1' });
        fields.push({ name: 'Field2' });

        const domain = DomainDesign.create({ fields, domainKindName: INT_LIST });
        await act(async () => {
            renderWithAppContext(<DomainFormImpl api={API} domain={domain} onChange={jest.fn()} testMode={false} />);
        });

        await act(async () => {
            const toggles = document.getElementsByClassName('toggle')[0].getElementsByClassName('btn');
            userEvent.click(toggles[0]);
        });

        expect(document.querySelector('.table-responsive').textContent).toContain('Is Primary Key');
    });

    test('with systemFields', async () => {
        const domain = DomainDesign.create({});

        await act(async () => {
            renderWithAppContext(
                <DomainFormImpl
                    api={API}
                    domain={domain}
                    onChange={jest.fn()}
                    systemFields={SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS}
                    testMode={true}
                />
            );
        });

        expect(document.getElementsByClassName('domain-system-fields')).toHaveLength(1);
    });
});
