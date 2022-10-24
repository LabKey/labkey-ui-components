import React from 'react';
import { mount } from 'enzyme';

import { ThreadBlock } from './ThreadBlock';
import { createTestAPIWrapper } from './test/utils';
import { COMMENTER, NOUN_PLURAL, NOUN_SINGULAR, THREAD, THREAD_WITH_RESPONSE } from './test/fixtures';

describe('ThreadBlock', () => {
    test('displays thread', () => {
        const wrapper = mount(
            <ThreadBlock
                api={createTestAPIWrapper()}
                canReply={true}
                nounPlural={NOUN_PLURAL}
                nounSingular={NOUN_SINGULAR}
                thread={THREAD}
                user={COMMENTER}
            />
        );

        // Displays formatted body -- not body
        expect(wrapper.find('.thread-block-body__content').text()).not.toContain(THREAD.body);
        expect(wrapper.find('.thread-block-body__content').text()).toContain('Test Thread');

        // Does not display thread editors
        expect(wrapper.find('.thread-editor').exists()).toEqual(false);

        // Displays header
        expect(wrapper.find('.thread-block-header__user').text()).toEqual(COMMENTER.displayName);

        // Allows for reply
        expect(wrapper.find('.thread-block__reply').exists()).toEqual(true);

        // Does not show reply toggle when responses are not available
        expect(wrapper.find('.thread-block__toggle-reply').exists()).toEqual(false);
    });
    test('toggles thread replies', () => {
        const onToggleResponses = jest.fn();

        const wrapper = mount(
            <ThreadBlock
                api={createTestAPIWrapper()}
                canReply={true}
                nounPlural={NOUN_PLURAL}
                nounSingular={NOUN_SINGULAR}
                onToggleResponses={onToggleResponses}
                thread={THREAD_WITH_RESPONSE}
                user={COMMENTER}
            />
        );

        // Displays toggle with responses initially hidden
        let replyToggle = wrapper.find('.thread-block__toggle-reply');
        expect(replyToggle.text()).toContain('Show all replies');

        replyToggle.simulate('click');
        expect(onToggleResponses).toHaveBeenCalled();

        wrapper.setProps({ showResponses: true });

        replyToggle = wrapper.find('.thread-block__toggle-reply');
        expect(replyToggle.text()).toContain('Hide all replies');
    });
    test('delete thread', async () => {
        const CANNOT_DELETE_USER = Object.assign({}, COMMENTER, { canDelete: false });

        const wrapper = mount(
            <ThreadBlock
                api={createTestAPIWrapper()}
                canReply={true}
                nounPlural={NOUN_PLURAL}
                nounSingular={NOUN_SINGULAR}
                onDelete={jest.fn()}
                thread={THREAD}
                user={CANNOT_DELETE_USER}
            />
        );

        // respects "canDelete"
        expect(wrapper.find('.thread-block-header__menu-delete').exists()).toEqual(false);

        // switch to a user who can delete
        wrapper.setProps({ user: COMMENTER });

        expect(wrapper.find('.thread-block-header__menu-delete').exists()).toEqual(true);
    });
});
