import React from 'react';
import { PicklistDeleteConfirmMessage } from './PicklistDeleteConfirm';
import { mount, ReactWrapper } from 'enzyme';
import { Alert } from '../base/Alert';
import { PicklistModel } from './models';

describe("PicklistDeleteConfirmMessage", () => {

    function validateText(wrapper: ReactWrapper, expectedAlerts: string[], unexpectedAlerts: string[] = [], expectedMsg: string[] = []) {
        const alert = wrapper.find(Alert);
        if (expectedAlerts?.length > 0) {
            expect(alert).toHaveLength(1);
            const alertText = alert.text();
            expectedAlerts.forEach(txt => {
                expect(alertText).toContain(txt);
            });
            unexpectedAlerts.forEach(txt => {
                expect(alertText.indexOf(txt)).toBe(-1);
            })
        }
        else {
            expect(alert).toHaveLength(0);
        }
        const msgSpan = wrapper.find("span");
        expect(msgSpan).toHaveLength(1);
        const msgText = msgSpan.text();
        if (expectedMsg == undefined) {
            expect(msgText.trim()).toHaveLength(0)
        }
        else {
            expectedMsg?.forEach(msg => {
                expect(msgText).toContain(msg);
            });
        }

    }

    test("no data", () => {
        const wrapper = mount(
            <PicklistDeleteConfirmMessage
                deletionData={undefined}
                numSelected={undefined}
                noun={undefined}
            />);
        expect(wrapper.find("span")).toHaveLength(0);
        wrapper.unmount();
    });

    test("many deletable, none public", () => {
        const wrapper = mount(
            <PicklistDeleteConfirmMessage
                deletionData={{
                    numDeletable: 3,
                    numNotDeletable: 0,
                    numShared: 0,
                    deletableLists: [],
                }}
                numSelected={3}
                noun={"Picklist"}
            />);
        validateText(wrapper,
            undefined,
            undefined,
            ['Are you sure you want to delete the selected lists?',
            'Deletion cannot be undone',
            'Do you want to proceed?'
        ]);
        wrapper.unmount();
    });

    test("all deletable, all public", () => {
        const wrapper = mount(
            <PicklistDeleteConfirmMessage
                deletionData={{
                    numDeletable: 3,
                    numNotDeletable: 0,
                    numShared: 3,
                    deletableLists: [],
                }}
                numSelected={3}
                noun={"Picklist"}
            />);
        validateText(wrapper, [
            'These are public picklists that are shared with your team members.'
        ], [
            'cannot be deleted'
        ], [
            'Are you sure you want to delete the selected lists?'
        ]);
        wrapper.unmount();
    });

    test("all deletable, one public", () => {
        const wrapper = mount(
            <PicklistDeleteConfirmMessage
                deletionData={{
                    numDeletable: 3,
                    numNotDeletable: 0,
                    numShared: 1,
                    deletableLists: [],
                }}
                numSelected={3}
                noun={"Picklist"}
            />);
        validateText(wrapper, [
            '1 of the 3 lists is a public picklist shared with your team members.'
        ], [
            'cannot be deleted'
        ]);
        wrapper.unmount();
    });


    test("all deletable, some public", () => {
        const wrapper = mount(
            <PicklistDeleteConfirmMessage
                deletionData={{
                    numDeletable: 3,
                    numNotDeletable: 0,
                    numShared: 2,
                    deletableLists: [],
                }}
                numSelected={3}
                noun={"Picklist"}
            />);
        validateText(wrapper, [
            '2 of the 3 lists are public picklists shared with your team members.'
        ], [
            'cannot be deleted'
        ]);
        wrapper.unmount();
    });

    test("none deletable, one public", () => {
        const wrapper = mount(
            <PicklistDeleteConfirmMessage
                deletionData={{
                    numDeletable: 0,
                    numNotDeletable: 3,
                    numShared: 1,
                    deletableLists: [],
                }}
                numSelected={3}
                noun={"Picklist"}
            />);
        validateText(wrapper, [
            'All of the selected picklists were created by other users and cannot be deleted.',
        ], [
            'shared with your team members'
        ], undefined);
        wrapper.unmount();
    });

    test ("one deletable, one public", () => {
        const wrapper = mount(
            <PicklistDeleteConfirmMessage
                deletionData={{
                    numDeletable: 1,
                    numNotDeletable: 3,
                    numShared: 1,
                    deletableLists: [new PicklistModel({name: 'Public Deletable', listId: 1})],
                }}
                numSelected={4}
                noun={"Picklist"}
            />);
        validateText(wrapper, [
            'This is a public picklist that is shared with your team members.',
            '3 of the 4 selected picklists were created by other users'
        ], [], [
            'Are you sure you want to delete "Public Deletable"?'
        ]);
        wrapper.unmount();
    });

    test("one deletable, not public", () => {
        const wrapper = mount(
            <PicklistDeleteConfirmMessage
                deletionData={{
                    numDeletable: 1,
                    numNotDeletable: 3,
                    numShared: 0,
                    deletableLists: [],
                }}
                numSelected={4}
                noun={"Picklist"}
            />);
        validateText(wrapper, [
            '3 of the 4 selected picklists were created by other users'
        ], [
            'This is a public picklist that is shared with your team members.',
        ]);
        wrapper.unmount();
    });

    test("one not deletable, not public", () => {
        const wrapper = mount(
            <PicklistDeleteConfirmMessage
                deletionData={{
                    numDeletable: 1,
                    numNotDeletable: 1,
                    numShared: 0,
                    deletableLists: [new PicklistModel({name: 'Public Deletable', listId: 1})],
                }}
                numSelected={2}
                noun={"Picklist"}
            />);
        validateText(wrapper, [
            '1 of the 2 selected picklists was created by another user'
        ], [
            'shared with your team members.',
        ], [
            'Are you sure you want to delete "Public Deletable"?'
        ]);
        wrapper.unmount();
    });

    test("one not deletable, public", () => {
        const wrapper = mount(
            <PicklistDeleteConfirmMessage
                deletionData={{
                    numDeletable: 0,
                    numNotDeletable: 1,
                    numShared: 1,
                    deletableLists: [],
                }}
                numSelected={1}
                noun={"Picklist"}
            />);
        validateText(wrapper, [
            'The selected picklist was created by another user',
        ], [
            'shared with your team members.',
        ], undefined);
        wrapper.unmount();
    });

    test("one private and one public selected, some deletable", () => {
        const wrapper = mount(
            <PicklistDeleteConfirmMessage
                deletionData={{
                    numDeletable: 1,
                    numNotDeletable: 3,
                    numShared: 1,
                    deletableLists: [],
                }}
                numSelected={4}
                noun={"Picklist"}
            />);
        validateText(wrapper, [
            '3 of the 4 selected picklists were created by other users',
            'This is a public picklist'
        ], [
        ], [
            'delete the selected lists'
        ]);
        wrapper.unmount();
    });

    test("some private and one public selected, some deletable", () => {
        const wrapper = mount(
            <PicklistDeleteConfirmMessage
                deletionData={{
                    numDeletable: 5,
                    numNotDeletable: 3,
                    numShared: 1,
                    deletableLists: [],
                }}
                numSelected={8}
                noun={"Picklist"}
            />);
        validateText(wrapper, [
            '3 of the 8 selected picklists were created by other users',
            '1 of the 5 lists is a public picklist'
        ], [
        ], [
            'delete the selected lists'
        ]);
        wrapper.unmount();
    });


    test("some private and some public selected, some deletable", () => {
        const wrapper = mount(
            <PicklistDeleteConfirmMessage
                deletionData={{
                    numDeletable: 5,
                    numNotDeletable: 3,
                    numShared: 3,
                    deletableLists: [],
                }}
                numSelected={8}
                noun={"Picklist"}
            />);
        validateText(wrapper, [
            '3 of the 8 selected picklists were created by other users',
            '3 of the 5 lists are public picklists'
        ], [

        ], [
            'delete the selected lists'
        ]);
        wrapper.unmount();
    });

    test("some private and some public selected, not deletable", () => {
        const wrapper = mount(
            <PicklistDeleteConfirmMessage
                deletionData={{
                    numDeletable: 0,
                    numNotDeletable: 3,
                    numShared: 3,
                    deletableLists: [],
                }}
                numSelected={3}
                noun={"Picklist"}
            />);
        validateText(wrapper, [
            'All of the selected picklists were created by other users',
        ], [
            'shared with your team members'
        ], undefined);
        wrapper.unmount();
    });
});

