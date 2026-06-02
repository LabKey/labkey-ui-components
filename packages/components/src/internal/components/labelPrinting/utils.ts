/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { User } from '../base/models/User';

export function userCanPrintLabels(user: User): boolean {
    return user && !user.isGuest;
}
