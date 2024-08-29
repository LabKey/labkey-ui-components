import React from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { ToggleButtons, ToggleIcon } from './ToggleButtons';

describe('ToggleButtons', () => {
    test('default props', async () => {
        const onClickFn = jest.fn();
        render(<ToggleButtons active="Enabled" onClick={onClickFn} />);

        expect(document.getElementsByTagName('input').length).toBe(0);
        expect(document.getElementsByClassName('toggle').length).toBe(1);
        expect(document.getElementsByClassName('toggle-on').length).toBe(1);
        expect(document.getElementsByClassName('toggle-off').length).toBe(0);

        expect(document.getElementsByTagName('button')[0].innerHTML).toBe('Enabled');
        expect(document.getElementsByTagName('button')[0].className).toBe('btn btn-primary');
        expect(document.getElementsByTagName('button')[0].disabled).toBe(false);
        expect(document.getElementsByTagName('button')[1].innerHTML).toBe('Disabled');
        expect(document.getElementsByTagName('button')[1].className).toBe('btn btn-default');
        expect(document.getElementsByTagName('button')[1].disabled).toBe(false);

        await userEvent.click(document.getElementsByTagName('button')[0]); // click already active button
        expect(onClickFn).toHaveBeenCalledTimes(0);
        await userEvent.click(document.getElementsByTagName('button')[1]); // click inactive button
        expect(onClickFn).toHaveBeenCalledTimes(1);
    });

    test('alternate button labels and set second to active', () => {
        const onClickFn = jest.fn();
        render(<ToggleButtons first="Yes" second="No" active="No" onClick={onClickFn} />);

        expect(document.getElementsByClassName('toggle-on').length).toBe(0);
        expect(document.getElementsByClassName('toggle-off').length).toBe(1);

        expect(document.getElementsByTagName('button')[0].innerHTML).toBe('Yes');
        expect(document.getElementsByTagName('button')[0].className).toBe('btn btn-default');
        expect(document.getElementsByTagName('button')[1].innerHTML).toBe('No');
        expect(document.getElementsByTagName('button')[1].className).toBe('btn btn-primary');
    });

    test('alternate button classNames, first active', () => {
        const onClickFn = jest.fn();
        render(
            <ToggleButtons
                active="Enabled"
                bsStyleFirstActive="default"
                bsStyleFirstInactive="disabled"
                bsStyleSecondActive="default"
                bsStyleSecondInactive="disabled"
                onClick={onClickFn}
            />
        );

        expect(document.getElementsByTagName('button')[0].className).toBe('btn btn-default');
        expect(document.getElementsByTagName('button')[1].className).toBe('btn btn-disabled');
    });

    test('alternate button classNames, second active', () => {
        const onClickFn = jest.fn();
        render(
            <ToggleButtons
                active="Disabled"
                bsStyleFirstActive="default"
                bsStyleFirstInactive="disabled"
                bsStyleSecondActive="default"
                bsStyleSecondInactive="disabled"
                onClick={onClickFn}
            />
        );

        expect(document.getElementsByTagName('button')[0].className).toBe('btn btn-disabled');
        expect(document.getElementsByTagName('button')[1].className).toBe('btn btn-default');
    });

    test('buttons disabled', () => {
        const onClickFn = jest.fn();
        render(<ToggleButtons active="Enabled" disabled onClick={onClickFn} />);

        expect(document.getElementsByTagName('button')[0].disabled).toBe(true);
        expect(document.getElementsByTagName('button')[1].disabled).toBe(true);
    });

    test('className prop', () => {
        const onClickFn = jest.fn();
        render(<ToggleButtons active="Enabled" className="test-class" onClick={onClickFn} />);

        expect(document.getElementsByClassName('toggle').length).toBe(1);
        expect(document.getElementsByClassName('test-class').length).toBe(1);
    });
});

describe('ToggleIcon', () => {
    test('default props', async () => {
        const onClickFn = jest.fn();
        render(<ToggleIcon active="off" onClick={onClickFn} />);

        expect(document.getElementsByTagName('input').length).toBe(0);
        expect(document.getElementsByClassName('toggle').length).toBe(1);
        expect(document.getElementsByClassName('toggle-on').length).toBe(0);
        expect(document.getElementsByClassName('fa-toggle-on').length).toBe(0);
        expect(document.getElementsByClassName('toggle-off').length).toBe(1);
        expect(document.getElementsByClassName('fa-toggle-off').length).toBe(1);

        await userEvent.click(document.getElementsByTagName('i')[0]);
        expect(onClickFn).toHaveBeenCalledTimes(1);
        expect(onClickFn).toHaveBeenCalledWith('on');
    });

    test('active first item', () => {
        const onClickFn = jest.fn();
        render(<ToggleIcon active="on" onClick={onClickFn} />);

        expect(document.getElementsByClassName('toggle').length).toBe(1);
        expect(document.getElementsByClassName('toggle-on').length).toBe(1);
        expect(document.getElementsByClassName('fa-toggle-on').length).toBe(1);
        expect(document.getElementsByClassName('toggle-off').length).toBe(0);
        expect(document.getElementsByClassName('fa-toggle-off').length).toBe(0);
    });

    test('className prop', () => {
        const onClickFn = jest.fn();
        render(<ToggleIcon active="on" className="test-class" onClick={onClickFn} />);

        expect(document.getElementsByClassName('toggle').length).toBe(1);
        expect(document.getElementsByClassName('test-class').length).toBe(1);
    });

    test('disabled', async () => {
        const onClickFn = jest.fn();
        render(<ToggleIcon active="off" disabled onClick={onClickFn} />);

        await userEvent.click(document.getElementsByTagName('i')[0]);
        expect(onClickFn).toHaveBeenCalledTimes(0);
    });

    test('tooltip', async () => {
        const onClickFn = jest.fn();
        render(<ToggleIcon active="off" toolTip="test tooltip" onClick={onClickFn} />);

        expect(document.getElementsByClassName('overlay-trigger').length).toBe(1);

        await userEvent.click(document.getElementsByTagName('i')[0]);
        expect(onClickFn).toHaveBeenCalledTimes(1);
        expect(onClickFn).toHaveBeenCalledWith('on');
    });
});
