import { User } from '@labkey/api';
import React, { FC, memo } from 'react';

// This is due to original implementation coming from ELN which serializes users in a limited fashion, we can convert
// this to just be User when we update ELN to serialize Users.
type AvatarUser = Pick<User, 'avatar' | 'displayName' | 'id'>;

interface UserAvatarProps {
    id: number;
    avatar: string;
    displayName: string;
}

export const UserAvatar: FC<UserAvatarProps> = memo(({ avatar, displayName, id }) => (
    <img key={id} className="user-avatar" src={avatar} alt={displayName} title={displayName} />
));

interface AuthorAvatarsProps {
    users: AvatarUser[];
}

export const UserAvatars: FC<AuthorAvatarsProps> = memo(({ users }) => {
    return (
        <span className="user-avatars">
            {users.map(author => (
                <UserAvatar key={author.id} {...author} />
            ))}
        </span>
    );
});
