/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
// This allows for IntelliJ to resolve custom jest matcher typings from
// @testing-library/jest-dom which are included via import in jest.setup.ts.
/// <reference types="@testing-library/jest-dom" />
/// <reference types="jest" />

/**
 * @deprecated Use getServerContext() from @labkey/api instead
 */
declare const LABKEY: import('@labkey/api').LabKey;

/**
 * Needed so we can use process.env.NODE_ENV, which is injected by webpack, but not included in the types declared in
 * the browser environments.
 */
declare const process: {
    env: {
        NODE_ENV: string;
    };
};
