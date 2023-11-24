import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DeleteIcon } from './DeleteIcon';

describe('DeleteIcon', () => {
    test('default properties', () => {
        const onDelete = jest.fn();
        render(<DeleteIcon onDelete={onDelete} />);
        expect(document.querySelectorAll('.field-icon')).toHaveLength(1);
        expect(document.querySelectorAll('.field-delete')).toHaveLength(1);
        expect(onDelete).toHaveBeenCalledTimes(0);
        userEvent.click(screen.getByTitle('Delete this item'));
        expect(onDelete).toHaveBeenCalledTimes(1);
    });

    test('custom properties', () => {
        const onDelete = jest.fn();
        render(<DeleteIcon onDelete={onDelete} id="delete-icon-custom-id" iconCls="delete-icon-custom-cls" title="Delete Icon Custom Title" />);
        expect(document.querySelectorAll('.field-icon')).toHaveLength(1);
        expect(document.querySelectorAll('.field-delete')).toHaveLength(0);
        expect(document.querySelectorAll('.delete-icon-custom-cls')).toHaveLength(1);
        expect(onDelete).toHaveBeenCalledTimes(0);
        userEvent.click(screen.getByTitle('Delete Icon Custom Title'));
        expect(onDelete).toHaveBeenCalledTimes(1);
    });
});
