import React, { act } from 'react';

import { getTestAPIWrapper } from '../../APIWrapper';

import { TEST_PROJECT, TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { SampleState } from './models';
import { ManageSampleStatusesPanel, SampleStatusDetail, SampleStatusesList } from './ManageSampleStatusesPanel';

import { getSamplesTestAPIWrapper } from './APIWrapper';
import { SampleStateType } from './constants';
import { render } from '@testing-library/react';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

describe('ManageSampleStatusesPanel', () => {
    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn, {
            samples: getSamplesTestAPIWrapper(jest.fn, {
                getSampleStatuses: jest.fn().mockResolvedValue([new SampleState({ isLocal: true, rowId: 1 })]),
            }),
        }),
        getIsDirty: jest.fn(),
        setIsDirty: jest.fn(),
    };

    function validate(hasError = false): void {
        expect(document.querySelector('.fa-spinner')).toBeNull();
        expect(document.querySelectorAll('.alert')).toHaveLength(hasError ? 1 : 0);

        expect(document.querySelectorAll('.panel')).toHaveLength(1);
        expect(document.querySelectorAll('.panel-heading')).toHaveLength(1);

        const elCount = !hasError ? 1 : 0;
        expect(document.querySelectorAll('.choices-container')).toHaveLength(elCount);
    }

    test('initial state', async () => {
        await act(async () => {
            renderWithAppContext(<ManageSampleStatusesPanel {...DEFAULT_PROPS} container={TEST_PROJECT_CONTAINER} />);
        });
        validate();
    });

    test('no states', async () => {
        await act(async () => {
            renderWithAppContext(
                <ManageSampleStatusesPanel
                    {...DEFAULT_PROPS}
                    container={TEST_PROJECT_CONTAINER}
                    api={getTestAPIWrapper(jest.fn, {
                        samples: getSamplesTestAPIWrapper(jest.fn, {
                            getSampleStatuses: jest.fn().mockResolvedValue([]),
                        }),
                    })}
                />
            );
        });

        validate();
    });

    test('error retrieving states', async () => {
        await act(async () => {
            renderWithAppContext(
                <ManageSampleStatusesPanel
                    {...DEFAULT_PROPS}
                    container={TEST_PROJECT_CONTAINER}
                    api={getTestAPIWrapper(jest.fn, {
                        samples: getSamplesTestAPIWrapper(jest.fn, {
                            getSampleStatuses: () => Promise.reject({ exception: 'Failure' }),
                        }),
                    })}
                />
            );
        });
        validate(true);
    });
});

describe('SampleStatusesList', () => {
    const DEFAULT_PROPS = {
        statesByType: {},
        selected: undefined,
        selectedGroup: undefined,
        onSelect: jest.fn,
    };

    function validate(statesByType: Record<string, SampleState[]>): void {
        const groupCount = Object.keys(statesByType).length;
        expect(document.querySelectorAll('.choices-list__empty-message')).toHaveLength(groupCount === 0 ? 1 : 0);
        const listGroups = document.querySelectorAll('.list-group');
        if (groupCount === 0) {
            expect(listGroups).toHaveLength(1);
            expect(listGroups.item(0).textContent).toBe('No sample statuses defined.');
        } else {
            expect(listGroups).toHaveLength(groupCount);
            const stateLists = Object.values(statesByType);
            listGroups.forEach((listGroup, index) => {
                expect(listGroup.querySelectorAll('.list-group-item')).toHaveLength(stateLists[index].length);
            });
        }
    }

    test('no states', () => {
        render(<SampleStatusesList {...DEFAULT_PROPS} />);
        validate({});
    });

    test('with states, no selection', () => {
        const states = {
            [SampleStateType.Available]: [
                new SampleState({ label: 'First', isLocal: true, rowId: 1 }),
                new SampleState({ label: 'Second', isLocal: true, rowId: 2 }),
            ],
            [SampleStateType.Consumed]: [
                new SampleState({ label: 'Third', isLocal: true, rowId: 3 }),
            ]
        };
        renderWithAppContext(<SampleStatusesList {...DEFAULT_PROPS} statesByType={states} />);
        validate(states);
        expect(document.querySelector('.active')).toBeNull();
    });

    test('with states, with selection', () => {
        const states = {
            [SampleStateType.Available]: [
                new SampleState({ label: 'First', isLocal: true, rowId: 1 }),
                new SampleState({ label: 'Second', isLocal: true, rowId: 2 }),
            ],
        };
        renderWithAppContext(
            <SampleStatusesList
                {...DEFAULT_PROPS}
                statesByType={states}
                selected={1}
                selectedGroup={SampleStateType.Available}
            />
        );
        validate(states);
        const buttons = document.querySelectorAll('button');
        expect(buttons.item(0).getAttribute('class')).not.toContain('active');
        expect(buttons.item(1).getAttribute('class')).toContain('active');
    });

    test('with multiple state types, with selection', () => {
        const states = {
            [SampleStateType.Available]: [
                new SampleState({ label: 'First', isLocal: true, rowId: 1 }),
                new SampleState({ label: 'Second', isLocal: true, rowId: 2 }),
            ],
            [SampleStateType.Consumed]: [
                new SampleState({ label: 'Third', isLocal: true, rowId: 3 }),
                new SampleState({ label: 'Fourth', isLocal: true, rowId: 4 }),
            ],
        };

        const unsortedStates = {
            [SampleStateType.Consumed]: [
                new SampleState({ label: 'Third', isLocal: true, rowId: 3 }),
                new SampleState({ label: 'Fourth', isLocal: true, rowId: 4 }),
            ],
            [SampleStateType.Available]: [
                new SampleState({ label: 'First', isLocal: true, rowId: 1 }),
                new SampleState({ label: 'Second', isLocal: true, rowId: 2 }),
            ],
        };
        renderWithAppContext(
            <SampleStatusesList
                {...DEFAULT_PROPS}
                statesByType={unsortedStates}
                selected={1}
                selectedGroup={SampleStateType.Consumed}
            />
        );
        validate(states);
        const buttons = document.querySelectorAll('button');
        expect(buttons.item(0).getAttribute('class')).not.toContain('active');
        expect(buttons.item(1).getAttribute('class')).not.toContain('active');
        expect(buttons.item(2).getAttribute('class')).not.toContain('active');
        expect(buttons.item(3).getAttribute('class')).toContain('active');
    });

    test('with states, in use and not local', () => {
        const states = {
            [SampleStateType.Available]: [
                new SampleState({ inUse: false, isLocal: true, containerPath: '/Test Parent/Test Project', rowId: 1 }),
                new SampleState({ inUse: true, isLocal: true, containerPath: '/Test Parent/Test Project', rowId: 2 }),
                new SampleState({ inUse: true, isLocal: false, containerPath: '/Test Parent', rowId: 3 }),
            ],
        };
        renderWithAppContext(<SampleStatusesList {...DEFAULT_PROPS} statesByType={states} />);
        validate(states);
        const listItems = document.querySelectorAll('.list-group-item');
        expect(listItems.item(0).querySelector('.choices-list__locked')).toBeNull();
        expect(listItems.item(1).querySelector('.choices-list__locked')).toBeTruthy();
        expect(listItems.item(2).querySelector('.choices-list__locked')).toBeTruthy();
    });
});

describe('SampleStatusDetail', () => {
    const STATE = new SampleState({
        label: 'Available',
        description: 'desc',
        stateType: 'Available',
        color: '#12FE34',
        inUse: false,
        isLocal: true,
        containerPath: '/Test',
    });
    const DEFAULT_PROPS = {
        addNew: false,
        state: STATE,
        onActionComplete: jest.fn(),
        onChange: jest.fn(),
    };

    function validate(hasState = true, showSelect = true, inputCount = 3): void {
        if (!hasState && showSelect) {
            expect(document.querySelector('.choices-detail__empty-message')).toBeTruthy();
        } else {
            expect(document.querySelector('.choices-detail__empty-message')).toBeFalsy();
        }
        if (hasState) {
            expect(document.querySelector('form')).toBeTruthy();
            expect(document.querySelectorAll('input')).toHaveLength(inputCount);
        } else {
            expect(document.querySelector('form')).toBeFalsy();
            expect(document.querySelectorAll('input')).toHaveLength(0);
        }
    }

    test('show select message', async () => {
        await act(async () => {
            renderWithAppContext(<SampleStatusDetail {...DEFAULT_PROPS} state={undefined} />, {
                serverContext: {
                    project: TEST_PROJECT,
                },
            });
        });
        validate(false);
    });

    test('do not show select message', async () => {
        await act(async () => {
            renderWithAppContext(<SampleStatusDetail {...DEFAULT_PROPS} state={null} />, {
                serverContext: {
                    project: TEST_PROJECT,
                },
            });
        });
        validate(false, false);
    });

    test('input values from state', async () => {
        await act(async () => {
            renderWithAppContext(<SampleStatusDetail {...DEFAULT_PROPS} />, {
                serverContext: {
                    project: TEST_PROJECT,
                },
            });
        });
        validate();
        expect(document.querySelector('input[name="label"]').getAttribute('value')).toBe(STATE.label);
        expect(document.querySelector('input[name="label"]').getAttribute('disabled')).toBeFalsy();
        expect(document.querySelector('.color-picker__button').getAttribute('disabled')).toBeFalsy();
        expect(document.querySelector('.color-picker__chip-small').getAttribute('style')).toBe(
            'background-color: rgb(18, 254, 52);'
        );
        expect(document.querySelector('.color-picker__remove')).toBeTruthy();
        expect(document.querySelector('textarea').value).toBe(STATE.description);
        expect(document.querySelector('textarea').getAttribute('disabled')).toBeFalsy();
        const selectInput = document.querySelector('.select-input__single-value');
        expect(selectInput.textContent).toBe(STATE.stateType);
        expect(selectInput.getAttribute('class')).not.toContain('select-input__single-value--is-disabled');
        const buttons = document.querySelectorAll('button');
        expect(buttons).toHaveLength(3);
        expect(buttons.item(1).textContent).toContain('Delete');
        expect(buttons.item(1).getAttribute('disabled')).toBeFalsy();
        expect(buttons.item(2).textContent).toBe('Save');
        expect(buttons.item(2).getAttribute('disabled')).not.toBeNull(); // save initially disabled
    });

    test('in use disabled', async () => {
        const inUseState = new SampleState({
            label: 'Available',
            stateType: 'Available',
            color: '#5555DD',
            inUse: true,
            isLocal: true,
            containerPath: '/Test',
        });
        await act(async () => {
            renderWithAppContext(<SampleStatusDetail {...DEFAULT_PROPS} state={inUseState} />, {
                serverContext: {
                    project: TEST_PROJECT,
                },
            });
        });
        validate(true, true, 2);
        expect(document.querySelector('input[name="label"]').getAttribute('disabled')).toBeFalsy();
        expect(document.querySelector('textarea').getAttribute('disabled')).toBeFalsy();
        expect(document.querySelector('.color-picker__button').getAttribute('disabled')).toBeFalsy();
        expect(document.querySelector('.color-picker__remove')).not.toBeNull();
        const selectInput = document.querySelector('.select-input__single-value');
        expect(selectInput.getAttribute('class')).toContain('select-input__single-value--is-disabled');
        const buttons = document.querySelectorAll('button');
        expect(buttons).toHaveLength(3);
        expect(buttons.item(1).textContent).toContain('Delete');
        expect(buttons.item(1).getAttribute('disabled')).not.toBeNull(); // delete disabled
        expect(buttons.item(2).textContent).toBe('Save');
        expect(buttons.item(2).getAttribute('disabled')).not.toBeNull(); // save initially disabled
    });

    test('not local, disabled', async () => {
        const inUseState = new SampleState({
            label: 'Available',
            stateType: 'Available',
            inUse: true,
            isLocal: false,
            containerPath: '/Test',
        });
        await act(async () => {
            renderWithAppContext(<SampleStatusDetail {...DEFAULT_PROPS} state={inUseState} />, {
                serverContext: {
                    project: TEST_PROJECT,
                },
            });
        });
        validate(true, false, 2);
        expect(document.querySelector('input[name="label"]').getAttribute('disabled')).not.toBeNull();
        expect(document.querySelector('.color-picker__button').getAttribute('disabled')).not.toBeNull();
        expect(document.querySelector('.color-picker__remove')).toBeNull();
        expect(document.querySelector('textarea').getAttribute('disabled')).not.toBeNull();
        expect(document.querySelector('.select-input__single-value--is-disabled')).not.toBeNull();

        expect(document.querySelectorAll('button')).toHaveLength(1); // just the color picker button
    });
});
