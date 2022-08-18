interface Member {
    id: number;
    name: string;
    type: string;
}

interface Group {
    groupName: string;
    members: Member[];
}

export interface GroupMembership {
    [key: string]: Group;
}
