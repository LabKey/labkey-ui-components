/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
export function decodeListResolverPath(resolverPath: string): string {
    return resolverPath.replace('$CPS', '').replace('$CPE', '');
}

export function encodeListResolverPath(containerPath: string): string {
    return ['$CPS', containerPath?.toLowerCase(), '$CPE'].join('');
}

export function getIntegerSearchParam(searchParams: URLSearchParams, paramName: string): number {
    const value = parseInt(searchParams.get(paramName), 10);
    return isNaN(value) ? undefined : value;
}
