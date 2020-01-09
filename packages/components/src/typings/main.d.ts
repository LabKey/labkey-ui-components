/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * This is maintained to give an idea of what "LABKEY" context the app utilizes. It is not meant
 * strictly for typing information and some objects are wrapped/consumed by the app with a more appropriate
 * app construct (e.g. container, user).
 */
type LabKey = {
    defaultHeaders: any
    devMode: boolean
    container: any // use core/model/Container instead
    contextPath: string
    moduleContext: any
    user: any // use core/model/User instead
    vis: any
    helpLinkPrefix: string
    getModuleContext: Function
};

/* App globals */
declare const LABKEY: LabKey;
