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

export interface GroupMembership {
    [key: string]: Group;
}

export enum MemberType {
    group = 'g',
    siteGroup = 'sg',
    user = 'u',
}
