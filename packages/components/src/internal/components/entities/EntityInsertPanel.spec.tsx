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
    const lookup = {containerPath: "/Look", keyColumn: "Name", displayColumn: "Name", query: 'LookHere'};
    const knownColumn = QueryColumn.create({
        name: 'known',
    });
    const alsoKnownColumn = QueryColumn.create({
        name: 'alsoKnown',
    });
    const aliasedColumn = QueryColumn.create({
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
                            QueryColumn.create({ name: 'known' }),
                            QueryColumn.create({ name: 'aliasName' }),
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
            QueryColumn.create({
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
                            QueryColumn.create({ name: 'known' }),
                            QueryColumn.create({ name: 'barcode1' }),
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
                barcode1: QueryColumn.create({
                    name: 'barcode1',
                    caption: 'Barcode 1',
                    conceptURI: STORAGE_UNIQUE_ID_CONCEPT_URI,
                }),
                otherCode: QueryColumn.create({
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
                            QueryColumn.create({ name: 'known' }),
                            QueryColumn.create({ name: 'barcode1' }),
                            QueryColumn.create({ name: 'Other Code' }),
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
                            QueryColumn.create({ name: 'known' }),
                            QueryColumn.create({ name: 'Nonesuch' }),
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
                bcode: QueryColumn.create({
                    name: 'bcode',
                    caption: 'Barcode',
                    conceptURI: STORAGE_UNIQUE_ID_CONCEPT_URI,
                }),
                otherCode: QueryColumn.create({
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
                            QueryColumn.create({ name: 'known' }),
                            QueryColumn.create({ name: 'Nonesuch' }),
                            QueryColumn.create({ name: 'Nonesuch' }),
                            QueryColumn.create({ name: 'Not Again' }),
                            QueryColumn.create({ name: 'bcode' }),
                            QueryColumn.create({ name: 'OtherCode' }),
                            QueryColumn.create({ name: 'OtherCode' }),
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
                            QueryColumn.create({ name: 'known' }),
                            QueryColumn.create({ name: 'parentA' }),
                            QueryColumn.create({ name: 'parentB' }),
                            QueryColumn.create({ name: 'parentc' }),
                            QueryColumn.create({ name: 'materialInputs/X', lookup}),
                            QueryColumn.create({ name: 'dataInputs/Y', lookup}),
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
                            QueryColumn.create({ name: 'known' }),
                            QueryColumn.create({ name: 'alsoAllowed' }),
                            QueryColumn.create({ name: 'materialInputs/X', lookup}),
                            QueryColumn.create({ name: 'dataInputs/Y', lookup }),
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
