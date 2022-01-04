import React from 'react';
import renderer from 'react-test-renderer';

import { getTestAPIWrapper } from '../../APIWrapper';

import { sleep } from '../../testHelpers';

import { NameExpressionGenIdBanner } from './NameExpressionGenIdBanner';
import { getDomainPropertiesTestAPIWrapper } from './APIWrapper';

describe('NameExpressionGenIdBanner', () => {
    test('with existing data', async () => {
        const tree = renderer.create(
            <NameExpressionGenIdBanner
                dataTypeName="Data1"
                rowId={100}
                kindName="DataClass"
                api={getTestAPIWrapper(jest.fn, {
                    domain: getDomainPropertiesTestAPIWrapper(jest.fn, {
                        hasExistingDomainData: () => Promise.resolve(true),
                        getGenId: () => Promise.resolve(123),
                    }),
                })}
            />
        );
        await sleep();
        await sleep(); // wait for 2 async calls
        expect(tree).toMatchSnapshot();
        tree.unmount();
    });

    test('without existing data, genId = 1 (0)', async () => {
        const tree = renderer.create(
            <NameExpressionGenIdBanner
                dataTypeName="Data1"
                rowId={100}
                kindName="DataClass"
                api={getTestAPIWrapper(jest.fn, {
                    domain: getDomainPropertiesTestAPIWrapper(jest.fn, {
                        hasExistingDomainData: () => Promise.resolve(false),
                        getGenId: () => Promise.resolve(0),
                    }),
                })}
            />
        );
        await sleep();
        await sleep();
        expect(tree).toMatchSnapshot();
        tree.unmount();
    });

    test('without existing data, genId > 1', async () => {
        const tree = renderer.create(
            <NameExpressionGenIdBanner
                dataTypeName="Data1"
                rowId={100}
                kindName="DataClass"
                api={getTestAPIWrapper(jest.fn, {
                    domain: getDomainPropertiesTestAPIWrapper(jest.fn, {
                        hasExistingDomainData: () => Promise.resolve(false),
                        getGenId: () => Promise.resolve(123),
                    }),
                })}
            />
        );
        await sleep();
        await sleep();
        expect(tree).toMatchSnapshot();
        tree.unmount();
    });
});
