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
import { act } from 'react-dom/test-utils';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ActionButton } from '../buttons/ActionButton';

import { initUnitTestMocks } from '../../../test/testHelperMocks';

import { FileAttachmentForm } from '../../../public/files/FileAttachmentForm';

import { SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS } from '../samples/constants';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { getTestAPIWrapper } from '../../APIWrapper';

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
import { DesignerDetailPanel } from './DesignerDetailPanel';

import { getDomainPropertiesTestAPIWrapper } from './APIWrapper';

beforeAll(() => {
    initUnitTestMocks();
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
        const onChange = jest.fn();
        const component = renderWithAppContext(
            <DomainForm
                domain={domain}
                onChange={onChange}
                domainFormDisplayOptions={{ hideImportExport: true, hideInferFromFile: true }}
                testMode={true}
            />,
            {
                appContext: {
                    api: getTestAPIWrapper(jest.fn),
                },
            }
        );
        // eslint-disable-next-line require-await
        await act(async () => {
            component;
        });

        component.debug();
        expect(onChange).toHaveBeenCalledTimes(1);

        // Empty panel
        const emptyHdrMsg = document.querySelectorAll('.domain-form-no-field-panel.panel.panel-default');
        expect(emptyHdrMsg.length).toEqual(1);

        // Add button
        const findButton = document.querySelectorAll('.domain-form-add-btn');
        expect(findButton.length).toEqual(1);

        // Search field
        const searchField = document.querySelectorAll('.form-control[placeholder="Search Fields"]');
        expect(searchField.length).toEqual(1);
        // This doesn't seem right
        expect(searchField[0]).toBeVisible();

        // Help link
        const helpLink = document.querySelectorAll('.domain-field-float-right');
        expect(helpLink.length).toEqual(1);
        expect(helpLink[0].getAttribute('href')).toEqual(
            'https://www.labkey.org/Documentation/wiki-page.view?referrer=inPage&name=fieldEditor'
        );
        expect(helpLink[0].getAttribute('rel')).toEqual('noopener noreferrer');

        // No Default System Fields
        const fieldRows = document.querySelectorAll('.domain-field-row');
        expect(fieldRows.length).toEqual(0);
    });

    // test('with reservedFieldsMsg', async () => {
    //     const fields = [];
    //     fields.push({
    //         name: 'key',
    //         rangeURI: INT_RANGE_URI,
    //         propertyId: 1,
    //         propertyURI: 'test',
    //     });
    //     fields.push({
    //         name: 'string',
    //         rangeURI: STRING_RANGE_URI,
    //         propertyId: 2,
    //         propertyURI: 'test',
    //     });
    //     const domain = DomainDesign.create({
    //         name: 'reserved fields msg',
    //         description: 'description',
    //         domainURI: 'test',
    //         domainId: 1,
    //         reservedFieldNames: ['string'],
    //         fields,
    //         indices: [],
    //     });
    //     const form = render(<DomainFormImpl domain={domain} onChange={jest.fn()} testMode={true} />);
    //
    //     // eslint-disable-next-line require-await
    //     await act(async () => {
    //         form;
    //     });
    //
    //     form.debug();
    //
    //     const alert = document.querySelector('.alert');
    //     expect(alert.textContent).toContain('Fields with reserved names');
    // });
});
