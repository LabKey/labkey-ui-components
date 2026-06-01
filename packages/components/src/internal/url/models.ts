/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { AppURL } from './AppURL';

export interface AppRouteResolver {
    cacheName?: string;
    clearCache?: () => void;
    fetch: (parts: string[]) => Promise<AppURL>;
    matches: (route: string) => boolean;
}
