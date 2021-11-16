import { TEST_USER_EDITOR, TEST_USER_FOLDER_ADMIN, TEST_USER_READER } from '../../../test/data/users';
import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from '../domainproperties/list/constants';

import { Picklist } from './models';

describe('Picklist', () => {
    test('isValid', () => {
        expect(new Picklist({}).isValid()).toBeFalsy();
        expect(new Picklist({ name: '' }).isValid()).toBeFalsy();
        expect(new Picklist({ name: '  ' }).isValid()).toBeFalsy();
        expect(new Picklist({ name: '  test' }).isValid()).toBeTruthy();
    });

    test('isUserList', () => {
        expect(new Picklist({}).isUserList(TEST_USER_READER)).toBeFalsy();
        expect(new Picklist({ CreatedBy: 1199 }).isUserList(TEST_USER_READER)).toBeFalsy();
        expect(new Picklist({ CreatedBy: 1200 }).isUserList(TEST_USER_READER)).toBeTruthy();
    });

    test('isEditable', () => {
        expect(new Picklist({}).isEditable(TEST_USER_READER)).toBeFalsy();
        expect(new Picklist({ CreatedBy: 1199 }).isEditable(TEST_USER_READER)).toBeFalsy();
        expect(new Picklist({ CreatedBy: 1200 }).isEditable(TEST_USER_READER)).toBeFalsy();

        expect(new Picklist({ CreatedBy: 1200 }).isEditable(TEST_USER_EDITOR)).toBeFalsy();
        expect(new Picklist({ CreatedBy: 1100 }).isEditable(TEST_USER_EDITOR)).toBeTruthy();
    });

    test('isPublic', () => {
        expect(new Picklist({}).isPublic()).toBeFalsy();
        expect(new Picklist({ Category: PRIVATE_PICKLIST_CATEGORY }).isPublic()).toBeFalsy();
        expect(new Picklist({ Category: PUBLIC_PICKLIST_CATEGORY }).isPublic()).toBeTruthy();
    });

    test('isDeletable', () => {
        expect(
            new Picklist({ CreatedBy: 1100, Category: PRIVATE_PICKLIST_CATEGORY }).isDeletable(TEST_USER_EDITOR)
        ).toBeTruthy();
        expect(
            new Picklist({ CreatedBy: 1005, Category: PRIVATE_PICKLIST_CATEGORY }).isDeletable(TEST_USER_EDITOR)
        ).toBeFalsy();
        expect(
            new Picklist({ CreatedBy: 1100, Category: PUBLIC_PICKLIST_CATEGORY }).isDeletable(TEST_USER_EDITOR)
        ).toBeTruthy();
        expect(
            new Picklist({ CreatedBy: 1005, Category: PUBLIC_PICKLIST_CATEGORY }).isDeletable(TEST_USER_EDITOR)
        ).toBeFalsy();

        expect(
            new Picklist({ CreatedBy: 1100, Category: PRIVATE_PICKLIST_CATEGORY }).isDeletable(TEST_USER_FOLDER_ADMIN)
        ).toBeFalsy();
        expect(
            new Picklist({ CreatedBy: 1005, Category: PRIVATE_PICKLIST_CATEGORY }).isDeletable(TEST_USER_FOLDER_ADMIN)
        ).toBeTruthy();
        expect(
            new Picklist({ CreatedBy: 1100, Category: PUBLIC_PICKLIST_CATEGORY }).isDeletable(TEST_USER_FOLDER_ADMIN)
        ).toBeTruthy();
        expect(
            new Picklist({ CreatedBy: 1005, Category: PUBLIC_PICKLIST_CATEGORY }).isDeletable(TEST_USER_FOLDER_ADMIN)
        ).toBeTruthy();
    });

    test('canRemoveItems', () => {
        expect(
            new Picklist({ CreatedBy: 1100, Category: PRIVATE_PICKLIST_CATEGORY }).canRemoveItems(TEST_USER_READER)
        ).toBeFalsy();
        expect(
            new Picklist({ CreatedBy: 1200, Category: PRIVATE_PICKLIST_CATEGORY }).canRemoveItems(TEST_USER_READER)
        ).toBeTruthy();
        expect(
            new Picklist({ CreatedBy: 1100, Category: PUBLIC_PICKLIST_CATEGORY }).canRemoveItems(TEST_USER_READER)
        ).toBeFalsy();
        expect(
            new Picklist({ CreatedBy: 1200, Category: PUBLIC_PICKLIST_CATEGORY }).canRemoveItems(TEST_USER_READER)
        ).toBeTruthy();

        expect(
            new Picklist({ CreatedBy: 1100, Category: PRIVATE_PICKLIST_CATEGORY }).canRemoveItems(TEST_USER_EDITOR)
        ).toBeTruthy();
        expect(
            new Picklist({ CreatedBy: 1200, Category: PRIVATE_PICKLIST_CATEGORY }).canRemoveItems(TEST_USER_EDITOR)
        ).toBeFalsy();
        expect(
            new Picklist({ CreatedBy: 1100, Category: PUBLIC_PICKLIST_CATEGORY }).canRemoveItems(TEST_USER_EDITOR)
        ).toBeTruthy();
        expect(
            new Picklist({ CreatedBy: 1200, Category: PUBLIC_PICKLIST_CATEGORY }).canRemoveItems(TEST_USER_EDITOR)
        ).toBeTruthy();
    });

    test('getSampleTypeFilter', () => {
        const picklist = new Picklist({ sampleIdsByType: { test1: [], test2: [1], test3: [2, 3] } });
        expect(picklist.getSampleTypeFilter('test1').getValue()).toStrictEqual([]);
        expect(picklist.getSampleTypeFilter('test2').getValue()).toStrictEqual([1]);
        expect(picklist.getSampleTypeFilter('test3').getValue()).toStrictEqual([2, 3]);
    });
});
