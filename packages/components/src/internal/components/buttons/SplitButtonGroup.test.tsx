import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SplitButtonGroup } from './SplitButtonGroup';

describe('SplitButtonGroup', () => {
    test('both buttons enabled', () => {
        const onClickFn = jest.fn();
        render(<SplitButtonGroup defaultBtnLabel="click me" onClickDefaultBtn={onClickFn} />);
        expect(document.querySelectorAll('.btn')).toHaveLength(2);
        expect(document.querySelectorAll('.btn-success')).toHaveLength(2);
        expect(screen.getByText('click me').getAttribute('disabled')).toBeNull();
        expect(document.querySelector('.dropdown-toggle').getAttribute('disabled')).toBeNull();

        expect(onClickFn).toHaveBeenCalledTimes(0);
        userEvent.click(screen.getByText('click me'));
        expect(onClickFn).toHaveBeenCalledTimes(1);
    });

    test('main button enabled, dropdown disabled', () => {
        const onClickFn = jest.fn();
        render(<SplitButtonGroup defaultBtnLabel="click me" onClickDefaultBtn={onClickFn} dropdownBtnDisabled />);
        expect(document.querySelectorAll('.btn')).toHaveLength(2);
        expect(document.querySelectorAll('.btn-success')).toHaveLength(2);
        expect(screen.getByText('click me').getAttribute('disabled')).toBeNull();
        expect(document.querySelector('.dropdown-toggle').getAttribute('disabled')).not.toBeNull();
    });

    test('main button disabled, dropdown enabled', () => {
        const onClickFn = jest.fn();
        render(<SplitButtonGroup defaultBtnLabel="click me" onClickDefaultBtn={onClickFn} defaultBtnDisabled />);
        expect(document.querySelectorAll('.btn')).toHaveLength(2);
        expect(document.querySelectorAll('.btn-success')).toHaveLength(2);
        expect(screen.getByText('click me').getAttribute('disabled')).not.toBeNull();
        expect(document.querySelector('.dropdown-toggle').getAttribute('disabled')).toBeNull();

        expect(onClickFn).toHaveBeenCalledTimes(0);
        userEvent.click(screen.getByText('click me'));
        expect(onClickFn).toHaveBeenCalledTimes(0);
    });
});
