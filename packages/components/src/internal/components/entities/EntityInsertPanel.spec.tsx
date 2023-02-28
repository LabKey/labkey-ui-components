import React from 'react';

import { mount } from 'enzyme';
import { List, Map, OrderedMap } from 'immutable';

import { QueryColumn } from '../../../public/QueryColumn';
import { DomainDetails } from '../domainproperties/models';
import { InferDomainResponse } from '../../../public/InferDomainResponse';
import { STORAGE_UNIQUE_ID_CONCEPT_URI } from '../domainproperties/constants';

import { EntityInsertPanelImpl } from './EntityInsertPanel';

describe('EntityInsertPanel.getWarningFieldList', () => {
    test('no fields', () => {
        expect(EntityInsertPanelImpl.getWarningFieldList([])).toStrictEqual([]);
    });

    test('one field', () => {
        const wrapper = mount(<div>{EntityInsertPanelImpl.getWarningFieldList(['one'])}</div>);
        expect(wrapper.text()).toBe('one');
        wrapper.unmount();
    });

    test('two fields', () => {
        const wrapper = mount(<div>{EntityInsertPanelImpl.getWarningFieldList(['one', 'two'])}</div>);
        expect(wrapper.text()).toBe('one and two');
        wrapper.unmount();
    });

    test('multiple fields', () => {
        const wrapper = mount(
            <div>{EntityInsertPanelImpl.getWarningFieldList(['one', 'two', 'three', 'four', 'five'])}</div>
        );
        expect(wrapper.text()).toBe('one, two, three, four, and five');
        wrapper.unmount();
    });
});

describe('EntityInsertPanel.getInferredFieldWarnings', () => {
    const lookup = { containerPath: '/Look', keyColumn: 'Name', displayColumn: 'Name', query: 'LookHere' };
    const knownColumn = new QueryColumn({
        name: 'known',
    });
    const alsoKnownColumn = new QueryColumn({
        name: 'alsoKnown',
    });
    const aliasedColumn = new QueryColumn({
        name: 'aliased',
    });

    const domainDetails = DomainDetails.create(
        Map<string, any>({
            domainDesign: {
                fields: [{ name: 'known' }, { name: 'aliased', importAliases: 'aliasName,otherAlias' }],
            },
            options: {
                importAliases: {
                    parentA: 'materialInputs/P',
                    parentB: 'dataInputs/B',
                },
            },
        })
    );

    const baseColumns = OrderedMap<string, QueryColumn>({
        known: knownColumn,
        alsoKnown: alsoKnownColumn,
        aliased: aliasedColumn,
    });

    test('none unknown, none unique', () => {
        const wrapper = mount(
            <div>
                {EntityInsertPanelImpl.getInferredFieldWarnings(
                    new InferDomainResponse({
                        data: List<any>(),
                        fields: List<QueryColumn>([
                            new QueryColumn({ name: 'known' }),
                            new QueryColumn({ name: 'aliasName' }),
                        ]),
                        reservedFields: List<QueryColumn>(),
                    }),
                    domainDetails,
                    baseColumns
                )}
            </div>
        );
        expect(wrapper.text()).toHaveLength(0);
        wrapper.unmount();
    });

    test('none unknown, one unique', () => {
        const columns = baseColumns.set(
            'barcode1',
            new QueryColumn({
                name: 'barcode1',
                caption: 'Barcode 1',
                conceptURI: STORAGE_UNIQUE_ID_CONCEPT_URI,
            })
        );

        const wrapper = mount(
            <div>
                {EntityInsertPanelImpl.getInferredFieldWarnings(
                    new InferDomainResponse({
                        data: List<any>(),
                        fields: List<QueryColumn>([
                            new QueryColumn({ name: 'known' }),
                            new QueryColumn({ name: 'barcode1' }),
                        ]),
                        reservedFields: List<QueryColumn>(),
                    }),
                    domainDetails,
                    columns
                )}
            </div>
        );
        expect(wrapper.text()).toContain(
            'barcode1 is a unique ID field. It will not be imported and will be managed by LabKey Server.'
        );
        wrapper.unmount();
    });

    test('none unknown, multiple unique', () => {
        const columns = baseColumns.merge(
            OrderedMap<string, QueryColumn>({
                barcode1: new QueryColumn({
                    name: 'barcode1',
                    caption: 'Barcode 1',
                    conceptURI: STORAGE_UNIQUE_ID_CONCEPT_URI,
                }),
                otherCode: new QueryColumn({
                    name: 'otherCode',
                    caption: 'Other Code',
                    conceptURI: STORAGE_UNIQUE_ID_CONCEPT_URI,
                }),
            })
        );

        const wrapper = mount(
            <div>
                {EntityInsertPanelImpl.getInferredFieldWarnings(
                    new InferDomainResponse({
                        data: List<any>(),
                        fields: List<QueryColumn>([
                            new QueryColumn({ name: 'known' }),
                            new QueryColumn({ name: 'barcode1' }),
                            new QueryColumn({ name: 'Other Code' }),
                        ]),
                        reservedFields: List<QueryColumn>(),
                    }),
                    domainDetails,
                    columns
                )}
            </div>
        );
        expect(wrapper.text()).toContain(
            'barcode1 and Other Code are unique ID fields. They will not be imported and will be managed by LabKey Server.'
        );
        wrapper.unmount();
    });

    test('one unknown, none unique', () => {
        const wrapper = mount(
            <div>
                {EntityInsertPanelImpl.getInferredFieldWarnings(
                    new InferDomainResponse({
                        data: List<any>(),
                        fields: List<QueryColumn>([
                            new QueryColumn({ name: 'known' }),
                            new QueryColumn({ name: 'Nonesuch' }),
                        ]),
                        reservedFields: List<QueryColumn>(),
                    }),
                    domainDetails,
                    baseColumns
                )}
            </div>
        );
        expect(wrapper.text()).toContain('Nonesuch is an unknown field and will be ignored.');
        wrapper.unmount();
    });

    test('multiple unknown, multiple unique', () => {
        const columns = baseColumns.merge(
            OrderedMap<string, QueryColumn>({
                bcode: new QueryColumn({
                    name: 'bcode',
                    caption: 'Barcode',
                    conceptURI: STORAGE_UNIQUE_ID_CONCEPT_URI,
                }),
                otherCode: new QueryColumn({
                    name: 'otherCode',
                    caption: 'Other Code',
                    conceptURI: STORAGE_UNIQUE_ID_CONCEPT_URI,
                }),
            })
        );

        const wrapper = mount(
            <div>
                {EntityInsertPanelImpl.getInferredFieldWarnings(
                    new InferDomainResponse({
                        data: List<any>(),
                        fields: List<QueryColumn>([
                            new QueryColumn({ name: 'known' }),
                            new QueryColumn({ name: 'Nonesuch' }),
                            new QueryColumn({ name: 'Nonesuch' }),
                            new QueryColumn({ name: 'Not Again' }),
                            new QueryColumn({ name: 'bcode' }),
                            new QueryColumn({ name: 'OtherCode' }),
                            new QueryColumn({ name: 'OtherCode' }),
                        ]),
                        reservedFields: List<QueryColumn>(),
                    }),
                    domainDetails,
                    columns
                )}
            </div>
        );
        expect(wrapper.text()).toContain('Nonesuch and Not Again are unknown fields and will be ignored.');
        expect(wrapper.text()).toContain(
            'bcode and OtherCode are unique ID fields. They will not be imported and will be managed by LabKey Server.'
        );
        wrapper.unmount();
    });

    test('with parent import aliases', () => {
        const wrapper = mount(
            <div>
                {EntityInsertPanelImpl.getInferredFieldWarnings(
                    new InferDomainResponse({
                        data: List<any>(),
                        fields: List<QueryColumn>([
                            new QueryColumn({ name: 'known' }),
                            new QueryColumn({ name: 'parentA' }),
                            new QueryColumn({ name: 'parentB' }),
                            new QueryColumn({ name: 'parentc' }),
                            new QueryColumn({ name: 'materialInputs/X', lookup }),
                            new QueryColumn({ name: 'dataInputs/Y', lookup }),
                        ]),
                        reservedFields: List<QueryColumn>(),
                    }),
                    domainDetails,
                    baseColumns
                )}
            </div>
        );
        expect(wrapper.text()).toContain('parentc is an unknown field and will be ignored.');
        wrapper.unmount();
    });

    test('with other allowed fields', () => {
        const wrapper = mount(
            <div>
                {EntityInsertPanelImpl.getInferredFieldWarnings(
                    new InferDomainResponse({
                        data: List<any>(),
                        fields: List<QueryColumn>([
                            new QueryColumn({ name: 'known' }),
                            new QueryColumn({ name: 'alsoAllowed' }),
                            new QueryColumn({ name: 'materialInputs/X', lookup }),
                            new QueryColumn({ name: 'dataInputs/Y', lookup }),
                        ]),
                        reservedFields: List<QueryColumn>(),
                    }),
                    domainDetails,
                    baseColumns,
                    ['otherAllowed', 'alsoAllowed']
                )}
            </div>
        );
        expect(wrapper.text()).toHaveLength(0);
        wrapper.unmount();
    });
});

describe('EntityInsertPanel.getNoUpdateFieldWarnings', () => {
    const lookup = { containerPath: '/Look', keyColumn: 'Name', displayColumn: 'Name', query: 'LookHere' };

    test('with disallowedUpdateFields', () => {
        const wrapper = mount(
            <div>
                {EntityInsertPanelImpl.getNoUpdateFieldWarnings(
                    new InferDomainResponse({
                        data: List<any>(),
                        fields: List<QueryColumn>([
                            new QueryColumn({ name: 'known' }),
                            new QueryColumn({ name: 'alsoAllowed' }),
                            new QueryColumn({ name: 'materialInputs/X', lookup }),
                            new QueryColumn({ name: 'dataInputs/Y', lookup }),
                        ]),
                        reservedFields: List<QueryColumn>(),
                    }),
                    ['alsoAllowed']
                )}
            </div>
        );
        expect(wrapper.text()).toContain('alsoAllowed cannot be updated and and will be ignored.');
        wrapper.unmount();
    });
});
