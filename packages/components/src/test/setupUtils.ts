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
import { resetNotificationsState } from '../internal/components/notifications/global';

// initialize the global state and the LABKEY object with enough structure to work for notifications
export function notificationInit() {
    resetNotificationsState();
    LABKEY.moduleContext = {
        study: {
            subject: {
                nounPlural: 'Participants',
                tableName: 'Participant',
                nounSingular: 'Participant',
                columnName: 'ParticipantId',
            },
            timepointType: 'VISIT',
        },
    };
    LABKEY.container = {
        title: 'Test Container',
        path: "testContainer",
        formats: {
            dateTimeFormat: 'yyyy-MM-dd HH:mm',
            numberFormat: null,
            dateFormat: 'yyyy-MM-dd'
        },
        id: "testContainerEntityId",
        activeModules: [
            "Wiki", "Issues", "Search", "FileContent", "Assay", "Experiment", "Query",
            "Pipeline", "Internal", "API", "Announcements", "Core", "Ontology"
        ],
    };
    LABKEY.project = {
        id: '2f59536d-4186-1039-be5d-ea54f212ba60',
        path: '/TestProjectName',
        rootId: '7aacb1a7-040d-1037-88ec-f467162bb89c',
        name: 'Test Project Name',
        title: 'Test Project Title',
    };
}
