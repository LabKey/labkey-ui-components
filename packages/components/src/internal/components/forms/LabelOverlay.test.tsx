import React from 'react';
import { render } from '@testing-library/react';
import { LabelOverlay } from './LabelOverlay';

describe('LabelOverlay', () => {

    it('renders label with overlay, not formsy', () => {
        render(<LabelOverlay label="Test Label" isFormsy={false} />);
        expect(document.querySelector('label')?.textContent).toBe('Test Label ');
        expect(document.querySelectorAll('.fa-question-circle')).toHaveLength(1);
    });

    it('renders label with overlay and required symbol when required, not formsy', () => {
        render(<LabelOverlay label="Test Label" required={true}  isFormsy={false}/>);
        expect(document.querySelector('label')?.textContent).toBe('Test Label * ');
        expect(document.querySelectorAll('.fa-question-circle')).toHaveLength(1);
    });

    it('renders label with overlay and required, but addLabelAsterisk = false, not formsy', () => {
        render(<LabelOverlay label="Test Label" required={true} addLabelAsterisk={false}  isFormsy={false} />);
        expect(document.querySelector('label')?.textContent).toBe('Test Label * ');
        expect(document.querySelectorAll('.fa-question-circle')).toHaveLength(1);
    });

    it('renders label with overlay, required = false, and addLabelAsterisk = true, , not formsy', () => {
        render(<LabelOverlay label="Test Label" required={false} addLabelAsterisk={true}  isFormsy={false} />);
        expect(document.querySelector('label')?.textContent).toBe('Test Label * ');
        expect(document.querySelectorAll('.fa-question-circle')).toHaveLength(1);
    });

    it('renders label with no overlay and required symbol when required, not formsy', () => {
        render(<LabelOverlay label="Test Label" required={true} helpTipRenderer='NONE' isFormsy={false} />);
        expect(document.querySelector('label')?.textContent).toBe('Test Label * ');
        expect(document.querySelectorAll('.fa-question-circle')).toHaveLength(0);
    });

    it('renders label with overlay, isFormsy = true (default)', () => {
        render(<LabelOverlay label="Test Label" />);
        expect(document.querySelector('label')).toBeNull();
        expect(document.querySelector('span')?.textContent).toBe('Test Label ');
        expect(document.querySelectorAll('.fa-question-circle')).toHaveLength(1);
    });

    it('renders label with overlay and required', () => {
        render(<LabelOverlay label="Test Label" isFormsy={true} required={true} />);
        expect(document.querySelector('label')).toBeNull();
        expect(document.querySelector('span')?.textContent).toBe('Test Label * ');
        expect(document.querySelectorAll('.fa-question-circle')).toHaveLength(1);
    });

    it('renders label with overlay and addLabelAsterisk', () => {
        render(<LabelOverlay label="Test Label" isFormsy={true} addLabelAsterisk={true} />);
        expect(document.querySelector('label')).toBeNull();
        expect(document.querySelector('span')?.textContent).toBe('Test Label * ');
        expect(document.querySelectorAll('.fa-question-circle')).toHaveLength(1);
    });

});
