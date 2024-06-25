import React from 'react';
import { DomainFieldMetadata } from './DomainFieldMetadata';
import { render } from '@testing-library/react';
import { QueryColumn } from '../../../public/QueryColumn';

describe('DomainFieldMetadata', () => {
    test('no properties or children', () => {
        const { container } = render(<DomainFieldMetadata />);
        // verify the document body is empty
        expect(container.firstChild).toBeNull();
    });

    test('no properties, with children', () => {
        render(
            <DomainFieldMetadata>
                <p className="testing-loc">Testing</p>
            </DomainFieldMetadata>
        );
        expect(document.querySelector('.testing-loc')).not.toBeNull();
    });

    test('individual description, no column', () => {
        render(
            <DomainFieldMetadata description="Some descriptive text">
                <p className="testing-loc">Testing</p>
            </DomainFieldMetadata>
        );
        const labels = document.querySelectorAll('strong');
        expect(labels).toHaveLength(1);
        expect(labels.item(0)).toHaveTextContent('Description');
        expect(document.querySelector('.ws-pre-wrap')).toHaveTextContent('Description Some descriptive text');
        expect(document.querySelector('.testing-loc')).not.toBeNull();
    });

    test('individual type, no column', () => {
        render(
            <DomainFieldMetadata type="boolean">
                <div className="testing-loc">Testing</div>
            </DomainFieldMetadata>
        );
        const paragraphs = document.querySelectorAll('p');
        const labels = document.querySelectorAll('strong');
        expect(labels).toHaveLength(1);
        expect(labels.item(0)).toHaveTextContent('Type');
        expect(paragraphs).toHaveLength(1);
        expect(paragraphs.item(0)).toHaveTextContent('Type boolean');
    });

    test('type and required, no column', () => {
        render(
            <DomainFieldMetadata type="boolean" required={true}>
                <div className="testing-loc">Testing</div>
            </DomainFieldMetadata>
        );
        const paragraphs = document.querySelectorAll('p');
        const labels = document.querySelectorAll('strong');
        expect(labels).toHaveLength(1);
        expect(labels.item(0)).toHaveTextContent('Type');
        expect(paragraphs).toHaveLength(2);
        expect(paragraphs.item(0)).toHaveTextContent('Type boolean');
        expect(paragraphs.item(1)).toHaveTextContent('This field is required.');
    });

    test('type and not required, no column', () => {
        render(
            <DomainFieldMetadata type="boolean" required={false}>
                <div className="testing-loc">Testing</div>
            </DomainFieldMetadata>
        );
        const paragraphs = document.querySelectorAll('p');
        const labels = document.querySelectorAll('strong');
        expect(labels).toHaveLength(1);
        expect(labels.item(0)).toHaveTextContent('Type');
        expect(paragraphs).toHaveLength(1);
        expect(paragraphs.item(0)).toHaveTextContent('Type boolean');
    });

    test('all individual props, no column', () => {
        render(<DomainFieldMetadata description="A rational description" type="boolean" required />);
        const paragraphs = document.querySelectorAll('p');
        const labels = document.querySelectorAll('strong');
        expect(labels).toHaveLength(2);
        expect(labels.item(0)).toHaveTextContent('Description');
        expect(labels.item(1)).toHaveTextContent('Type');
        expect(paragraphs).toHaveLength(3);
        expect(paragraphs.item(0)).toHaveTextContent('Description A rational description');
        expect(paragraphs.item(1)).toHaveTextContent('Type boolean');
        expect(paragraphs.item(2)).toHaveTextContent('This field is required.');
    });

    test('individual metadata with column', () => {
        const column = new QueryColumn({
            description: 'Column description',
            type: 'string',
            required: true,
        });
        render(
            <DomainFieldMetadata type="boolean" required={false} column={column}>
                <div className="testing-loc">Testing</div>
            </DomainFieldMetadata>
        );
        const paragraphs = document.querySelectorAll('p');
        const labels = document.querySelectorAll('strong');
        expect(labels).toHaveLength(2);
        expect(labels.item(0)).toHaveTextContent('Description');
        expect(labels.item(1)).toHaveTextContent('Type');
        expect(paragraphs).toHaveLength(2);
        expect(paragraphs.item(0)).toHaveTextContent('Description ' + column.description);
        expect(paragraphs.item(1)).toHaveTextContent('Type boolean');
        expect(document.querySelector('.testing-loc')).not.toBeNull();
    });

    test('column with all metadata', () => {
        const column = new QueryColumn({
            description: 'Column description',
            type: 'Integer',
            required: true,
            phiProtected: true,
            fieldKey: 'Test/Lookup',
            format: '000',
            caption: 'Label',
        });
        render(
            <DomainFieldMetadata column={column}>
                <div className="testing-loc">Testing</div>
            </DomainFieldMetadata>
        );
        const paragraphs = document.querySelectorAll('p');
        const labels = document.querySelectorAll('strong');
        expect(labels).toHaveLength(4);
        expect(labels.item(0)).toHaveTextContent('Description');
        expect(labels.item(1)).toHaveTextContent('Type');
        expect(labels.item(2)).toHaveTextContent('Field Key');
        expect(labels.item(3)).toHaveTextContent('Display Format');
        expect(paragraphs).toHaveLength(6);
        expect(paragraphs.item(0)).toHaveTextContent('Description ' + column.description);
        expect(paragraphs.item(1)).toHaveTextContent('Type Integer');
        expect(paragraphs.item(2)).toHaveTextContent('Field Key Test/Lookup');
        expect(paragraphs.item(3)).toHaveTextContent('Display Format 000');
        expect(paragraphs.item(4)).toHaveTextContent('PHI protected data removed.');
        expect(paragraphs.item(5)).toHaveTextContent('This field is required.');
        expect(document.querySelector('.testing-loc')).not.toBeNull();
    });

    test('column with metadata subset without child', () => {
        const column = new QueryColumn({
            type: 'string',
            phiProtected: true,
            fieldKey: 'Label',
            caption: 'Label',
        });
        render(<DomainFieldMetadata column={column} />);
        const paragraphs = document.querySelectorAll('p');
        const labels = document.querySelectorAll('strong');
        expect(labels).toHaveLength(1);
        expect(labels.item(0)).toHaveTextContent('Type');
        expect(paragraphs).toHaveLength(2);
        expect(paragraphs.item(0)).toHaveTextContent('Type string');
        expect(paragraphs.item(1)).toHaveTextContent('PHI protected data removed.');
    });
});
