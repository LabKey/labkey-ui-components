import React from 'react';
import { render } from '@testing-library/react';
import { CommentTextArea } from './CommentTextArea';

describe('CommentTextArea', () => {
    test('not required', () => {
        render(<CommentTextArea actionName="Action" onChange={jest.fn()} />);
        expect(document.querySelector('textarea').getAttribute('placeholder')).toBe('Enter reason (optional)');
        expect(document.querySelector('label').textContent).toBe('Reason for Action');
    });

    test('not required, disabled', () => {
        render(<CommentTextArea actionName="Action" onChange={jest.fn()} disabled containerClassName="my-spacing" />);
        expect(document.querySelector('textarea').getAttribute('placeholder')).toBe('Enter reason (optional)');
        expect(document.querySelector('textarea').getAttribute('disabled')).toBe('');
        expect(document.querySelector('label').textContent).toBe('Reason for Action');
        expect(document.querySelector('.my-spacing')).not.toBeNull();
    });

    test('is required', () => {
        render(<CommentTextArea actionName="Action" onChange={jest.fn()} requiresUserComment={true} />);
        expect(document.querySelector('textarea').getAttribute('placeholder')).toBe('Enter reason (required)');
        expect(document.querySelector('label').textContent).toBe('Reason for Action *');
    });
});
