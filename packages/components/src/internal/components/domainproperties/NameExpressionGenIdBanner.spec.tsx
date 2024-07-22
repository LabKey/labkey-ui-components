import React from 'react';
import renderer from 'react-test-renderer';

import { sleep } from '../../test/testHelpers';

import { getTestAPIWrapper } from '../../APIWrapper';

import { NotificationsContextProvider } from '../notifications/NotificationsContext';

import { getEntityTestAPIWrapper } from '../entities/APIWrapper';

import { NameExpressionGenIdBanner } from './NameExpressionGenIdBanner';
import { getDomainPropertiesTestAPIWrapper } from './APIWrapper';

describe('NameExpressionGenIdBanner', () => {
    test('with existing data', async () => {
        const tree = renderer.create(
            <NotificationsContextProvider>
                <NameExpressionGenIdBanner
                    dataTypeName="Data1"
                    rowId={100}
                    kindName="DataClass"
                    api={getTestAPIWrapper(jest.fn, {
                        domain: getDomainPropertiesTestAPIWrapper(jest.fn, {
                            getGenId: jest.fn().mockResolvedValue(123),
                        }),
                        entity: getEntityTestAPIWrapper(jest.fn, {
                            isDataTypeEmpty: jest.fn().mockResolvedValue(false),
                        }),
                    })}
                />
            </NotificationsContextProvider>
        );
        await sleep();
        await sleep(); // wait for 2 async calls
        expect(tree).toMatchSnapshot();
        tree.unmount();
    });

    test('without existing data, genId = 1 (0)', async () => {
        const tree = renderer.create(
            <NotificationsContextProvider>
                <NameExpressionGenIdBanner
                    dataTypeName="Data1"
                    rowId={100}
                    kindName="DataClass"
                    api={getTestAPIWrapper(jest.fn, {
                        domain: getDomainPropertiesTestAPIWrapper(jest.fn, {
                            getGenId: jest.fn().mockResolvedValue(0),
                        }),
                        entity: getEntityTestAPIWrapper(jest.fn, {
                            isDataTypeEmpty: jest.fn().mockResolvedValue(true),
                        }),
                    })}
                />
            </NotificationsContextProvider>
        );
        await sleep();
        await sleep();
        expect(tree).toMatchSnapshot();
        tree.unmount();
    });

    test('without existing data, genId > 1', async () => {
        const tree = renderer.create(
            <NotificationsContextProvider>
                <NameExpressionGenIdBanner
                    dataTypeName="Data1"
                    rowId={100}
                    kindName="DataClass"
                    api={getTestAPIWrapper(jest.fn, {
                        domain: getDomainPropertiesTestAPIWrapper(jest.fn, {
                            getGenId: jest.fn().mockResolvedValue(123),
                        }),
                        entity: getEntityTestAPIWrapper(jest.fn, {
                            isDataTypeEmpty: jest.fn().mockResolvedValue(true),
                        }),
                    })}
                />
            </NotificationsContextProvider>
        );
        await sleep();
        await sleep();
        expect(tree).toMatchSnapshot();
        tree.unmount();
    });
});
