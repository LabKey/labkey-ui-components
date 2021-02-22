
import {DomainPropertiesGrid} from "./DomainPropertiesGrid";
import React from "react";
import {DomainDesign} from "./models";
import {mount} from "enzyme";
import {INTEGER_TYPE, TEXT_TYPE} from "./PropDescType";

const DOMAIN = DomainDesign.create({
    fields: [
        { name: 'a', rangeURI: INTEGER_TYPE.rangeURI },
        { name: 'b', rangeURI: TEXT_TYPE.rangeURI },
    ],
});
const ACTIONS = {
    toggleSelectAll: jest.fn(),
    scrollFunction: jest.fn(),
    onFieldsChange: jest.fn()
}

describe('DomainPropertiesGrid', () => {
    test('default view', () => {
        const domainPropertiesGrid = mount(
            <DomainPropertiesGrid
                domain={DOMAIN}
                search="searchStr"
                actions={ACTIONS}
                selectAll={false}
                appPropertiesOnly={false}
            />);
        const text = domainPropertiesGrid.text();

        expect(text).toContain("URL");
        expect(text).toContain("Range URI");
        expect(text).toContain("Lock Type");
        expect(text).toContain("Lookup Container");
        expect(text).toContain("Description");
        expect(text).toContain("Conditional Formats");
        expect(text).toContain("Property Validators");

        // Removed column, as this information does not surface in UI
        expect(text).not.toContain("Property URI");
        // Ontology-only
        expect(text).not.toContain("Source Ontology");

        domainPropertiesGrid.unmount();
    });

    test('with appPropertiesOnly', () => {
        const domainPropertiesGrid = mount(
            <DomainPropertiesGrid
                domain={DOMAIN}
                search="searchStr"
                actions={ACTIONS}
                selectAll={false}
                appPropertiesOnly={true}
            />);
        const text = domainPropertiesGrid.text();

        expect(text).toContain("URL");
        expect(text).toContain("Range URI");
        expect(text).toContain("Lock Type");
        expect(text).not.toContain("Lookup Container");
        expect(text).toContain("Description");
        expect(text).not.toContain("Conditional Formats");
        expect(text).toContain("Property Validators");

        expect(text).not.toContain("Property URI");
        expect(text).not.toContain("Source Ontology");

        domainPropertiesGrid.unmount();
    });
});
