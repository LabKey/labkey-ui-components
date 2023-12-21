export interface Member {
    id: number;
    name: string;
    type: string;
}

interface Group {
    groupName: string;
    members: Member[];
    type?: string;
}

export type GroupMembership = {
    groupId: number;
    groupName: string;
    userDisplayName: string;
    userEmail: string;
    userId: number;
};

export type Groups = Record<string, Group>;

export enum MemberType {
    group = 'g',
    siteGroup = 'sg',
    user = 'u',
}
