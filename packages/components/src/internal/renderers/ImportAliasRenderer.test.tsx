import React, { act } from 'react';
import { fromJS } from 'immutable';

import { renderWithAppContext } from '../test/reactTestLibraryHelpers';

import { ImportAliasRenderer } from './ImportAliasRenderer';

const DEFAULT_PROPS = {
    appRouteMap: { 'materialInputs/': 'samples' },
    data: undefined,
};

describe('ImportAliasRenderer', () => {
    function validate(aliasCount = 0): void {
        expect(document.querySelectorAll('div.alias-renderer--details')).toHaveLength(aliasCount);
        expect(document.querySelectorAll('a')).toHaveLength(aliasCount);
    }

    test('without data', async () => {
        await act(async () => {
            renderWithAppContext(<ImportAliasRenderer {...DEFAULT_PROPS} />);
        });
        validate();
    });

    test('with single alias key', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
                <ImportAliasRenderer
                    {...DEFAULT_PROPS}
                    data={fromJS({
                        displayValue: {
                            key1: {
                                inputType: 'materialInputs/value1',
                                required: false,
                            },
                        },
                    })}
                />
            );
        });
        validate(1);

        expect(document.querySelector('div.alias-renderer--details').textContent).toBe('key1, alias for: value1');
        expect(document.querySelector('a').getAttribute('href')).toBe('#/samples/value1');
        expect(document.querySelector('a').textContent).toBe('value1');
    });

    test('with multiple alias key', async () => {
        await act(async () => {
            renderWithAppContext(
                <ImportAliasRenderer
                    {...DEFAULT_PROPS}
                    data={fromJS({
                        displayValue: {
                            key1: {
                                inputType: 'materialInputs/value1',
                            },
                            key2: {
                                inputType: 'materialInputs/value2',
                                required: true,
                            },
                        },
                    })}
                />
            );
        });
        validate(2);
        expect(document.querySelectorAll('div.alias-renderer--details')[0].textContent).toBe('key1, alias for: value1');
        expect(document.querySelectorAll('a')[0].getAttribute('href')).toBe('#/samples/value1');
        expect(document.querySelectorAll('a')[0].textContent).toBe('value1');
        expect(document.querySelectorAll('div.alias-renderer--details')[1].textContent).toBe(
            'key2, alias for: value2, required'
        );
        expect(document.querySelectorAll('a')[1].getAttribute('href')).toBe('#/samples/value2');
        expect(document.querySelectorAll('a')[1].textContent).toBe('value2');
    });

    test('with multiple appRouteMap entries', async () => {
        await act(async () => {
            renderWithAppContext(
                <ImportAliasRenderer
                    {...DEFAULT_PROPS}
                    appRouteMap={{ 'materialInputs/': 'samples', 'dataInputs/': 'registry' }}
                    data={fromJS({
                        displayValue: {
                            key1: {
                                inputType: 'materialInputs/value1',
                                required: false,
                            },
                            key2: {
                                inputType: 'materialInputs/value2',
                            },
                            key3: {
                                inputType: 'dataInputs/value3',
                            },
                        },
                    })}
                />
            );
        });
        validate(3);
        expect(document.querySelectorAll('div.alias-renderer--details')[0].textContent).toBe('key1, alias for: value1');
        expect(document.querySelectorAll('a')[0].getAttribute('href')).toBe('#/samples/value1');
        expect(document.querySelectorAll('a')[0].textContent).toBe('value1');
        expect(document.querySelectorAll('div.alias-renderer--details')[2].textContent).toBe('key3, alias for: value3');
        expect(document.querySelectorAll('a')[2].getAttribute('href')).toBe('#/registry/value3');
        expect(document.querySelectorAll('a')[2].textContent).toBe('value3');
    });
});
