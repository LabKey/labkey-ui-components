/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
export interface Member {
    id: number;
    name: string;
    type: string;
    userActive?: boolean;
}

interface Group {
    groupName: string;
    members: Member[];
    type?: string;
}

export type GroupMembership = {
    groupId: number;
    groupName: string;
    userActive?: boolean;
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
