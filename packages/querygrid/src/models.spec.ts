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
import { List, Map } from 'immutable';
import { resetQueryGridState } from "./global";
import { QueryGridModel, QueryInfo, SchemaQuery } from '@glass/base';
import { CellMessage, EditorModel, ValueDescriptor } from './models';

import sampleSet2QueryInfo from "./test/data/sampleSet2-getQueryDetails.json";

const editableGridWithData = {
    "cellMessages": Map<string, CellMessage>({
        "1-0": "description 1 message"
    }),
    "cellValues": Map<string, List<ValueDescriptor>>({
        "0-0": List<ValueDescriptor>([
            {
                "display": "S-1",
                "raw": "S-1"
            }
        ]),
        "0-1": List<ValueDescriptor>([
            {
                "display": "S-2",
                "raw": "S-2"
            }
        ]),
        "0-2": List<ValueDescriptor>([
            {
                "display": "S-3",
                "raw": "S-3"
            }
        ]),
        "1-0": List<ValueDescriptor>([
            {
                "display": "Description 1",
                "raw": "Description 1"
            }
        ]),
        "1-1": List<ValueDescriptor>([
            {
                "display": "Description 2",
                "raw": "Description 2"
            }
        ]),
        "1-2": List<ValueDescriptor>([
            {
                "display": "Description 3",
                "raw": "Description 3"
            }
        ]),
        "5-0": List<ValueDescriptor>([
            {
                "display": "requirement 1",
                "raw": "requirement 1"
            }
        ])
    }),
    "colCount": 5,
    "id": "insert-samples|samples\/sample set 2",
    "isPasting": false,
    "focusColIdx": 1,
    "focusRowIdx": 1,
    "numPastedRows": 0,
    "rowCount": 3,
    "selectedColIdx": 1,
    "selectedRowIdx": 1,
    "selectionCells": [

    ]
};

const schemaQ = new SchemaQuery({
    schemaName: "samples",
    queryName: "Sample Set 2"
});

const queryGridModel = new QueryGridModel( {
    schema: schemaQ.schemaName,
    query: schemaQ.queryName,
    id: 'insert-samples|samples/sample set 2',
    queryInfo: QueryInfo.fromJSON(sampleSet2QueryInfo),
    editable: true,
    data: Map<any, Map<string, any>>(
        {
            "1": Map<string, any>({
                "Description": "S-1 Description"
            }),
            "2": Map<string, any>({
                "Description": "S-2 Description"
            })
        }
    ),
    dataIds: List<any>([
        "1", "2"
    ])
});

beforeEach(() => {
    resetQueryGridState();
});

describe("EditorModel", () => {
    describe("data validation", () => {
        test("no data", () => {
            const emptyEditorGridData = {
                "cellMessages": Map<string, CellMessage>(),
                "cellValues": Map<string, List<ValueDescriptor>>(),
                "colCount": 5,
                "id": "insert-samples|samples\/sample set 2",
                "isPasting": false,
                "focusColIdx": -1,
                "focusRowIdx": -1,
                "numPastedRows": 0,
                "rowCount": 0,
                "selectedColIdx": -1,
                "selectedRowIdx": -1,
                "selectionCells": [

                ]
            };
            const editorModel = new EditorModel(emptyEditorGridData);
            const emptyQueryGridModel = new QueryGridModel( {
                schema: schemaQ.schemaName,
                query: schemaQ.queryName,
                id: 'insert-samples|samples/sample set 2',
                queryInfo: QueryInfo.fromJSON(sampleSet2QueryInfo),
                editable: true
            });
            const {uniqueKeyViolations, missingRequired} = editorModel.validateData(emptyQueryGridModel, "Name");
            expect(uniqueKeyViolations.isEmpty()).toBe(true);
            expect(missingRequired.isEmpty()).toBe(true);
            const errors = editorModel.getValidationErrors(emptyQueryGridModel, "Name");
            expect(errors).toHaveLength(0);
        });

        test("valid data", () => {
            const editableGridData = {
                "cellMessages": Map<string, CellMessage>({
                    "1-0": "description 1 message"
                }),
                "cellValues": Map<string, List<ValueDescriptor>>({
                    "0-0": List<ValueDescriptor>([
                        {
                            "display": "S-1",
                            "raw": "S-1"
                        }
                    ]),
                    "0-1": List<ValueDescriptor>([
                        {
                            "display": "S-2",
                            "raw": "S-2"
                        }
                    ]),
                    "1-0": List<ValueDescriptor>([
                        {
                            "display": "Description 1",
                            "raw": "Description 1"
                        }
                    ]),
                    "1-1": List<ValueDescriptor>([
                        {
                            "display": "Description 2",
                            "raw": "Description 2"
                        }
                    ]),
                    "5-0": List<ValueDescriptor>([
                        {
                            "display": "requirement 1",
                            "raw": "requirement 1"
                        }
                    ]),
                    "5-1": List<ValueDescriptor>([
                        {
                            "display": "requirement 2",
                            "raw": "requirement 2"
                        }
                    ])
                }),
                "colCount": 5,
                "id": "insert-samples|samples\/sample set 2",
                "isPasting": false,
                "focusColIdx": 1,
                "focusRowIdx": 1,
                "numPastedRows": 0,
                "rowCount": 2,
                "selectedColIdx": 1,
                "selectedRowIdx": 1,
                "selectionCells": []
            };
            const editorModel = new EditorModel(editableGridData);
            const queryGridModel = new QueryGridModel( {
                schema: schemaQ.schemaName,
                query: schemaQ.queryName,
                id: 'insert-samples|samples/sample set 2',
                queryInfo: QueryInfo.fromJSON(sampleSet2QueryInfo),
                editable: true,
                data: Map<any, Map<string, any>>(
                    {
                        "1": Map<string, any>({
                            "RequiredData": "Grid Requirement 1"
                        }),
                        "2": Map<string, any>({
                            "Description": "grid S-2 Description"
                        })
                    }
                ),
                dataIds: List<any>([
                    "1"
                ])
            });
            const {uniqueKeyViolations, missingRequired} = editorModel.validateData(queryGridModel, "Name");
            expect(uniqueKeyViolations.isEmpty()).toBe(true);
            expect(missingRequired.isEmpty()).toBe(true);
            const errors = editorModel.getValidationErrors(queryGridModel, "Name");
            expect(errors).toHaveLength(0);
        });

        test("missing required data", () => {
            const editableGridData = {
                "cellMessages": Map<string, CellMessage>({
                    "1-0": "description 1 message"
                }),
                "cellValues": Map<string, List<ValueDescriptor>>({
                    "0-1": List<ValueDescriptor>([
                        {
                            "display": "S-2",
                            "raw": "S-2"
                        }
                    ]),
                    "1-0": List<ValueDescriptor>([
                        {
                            "display": "Description 1",
                            "raw": "Description 1"
                        }
                    ]),
                    "1-1": List<ValueDescriptor>([
                        {
                            "display": "Description 2",
                            "raw": "Description 2"
                        }
                    ]),
                    "5-0": List<ValueDescriptor>([
                        {
                            "display": "requirement 1",
                            "raw": "requirement 1"
                        }
                    ]),
                }),
                "colCount": 5,
                "id": "insert-samples|samples\/sample set 2",
                "isPasting": false,
                "focusColIdx": 1,
                "focusRowIdx": 1,
                "numPastedRows": 0,
                "rowCount": 3,
                "selectedColIdx": 1,
                "selectedRowIdx": 1,
                "selectionCells": []
            };
            const editorModel = new EditorModel(editableGridData);
            const queryGridModel = new QueryGridModel( {
                schema: schemaQ.schemaName,
                query: schemaQ.queryName,
                id: 'insert-samples|samples/sample set 2',
                queryInfo: QueryInfo.fromJSON(sampleSet2QueryInfo),
                editable: true,
                data: Map<any, Map<string, any>>(
                    {
                        "1": Map<string, any>({
                            "Description": "grid S-1 Description"
                        }),
                        "2": Map<string, any>({
                            "Description": "grid S-2 Description"
                        }),
                        "3": Map<string, any>({
                            "Description": "grid S-3 Description"
                        })
                    }
                ),
                dataIds: List<any>([
                    "1", "2", "3"
                ])
            });
            const {uniqueKeyViolations, missingRequired} = editorModel.validateData(queryGridModel, "Name");
            expect(uniqueKeyViolations.isEmpty()).toBe(true);
            expect(missingRequired.size).toBe(2);
            expect(missingRequired.has("Name")).toBe(true);
            expect(missingRequired.get("Name").size).toBe(2);
            expect(missingRequired.get("Name").contains(1)).toBe(true);
            expect(missingRequired.get("Name").contains(3)).toBe(true);
            const errors = editorModel.getValidationErrors(queryGridModel, "Name");
            expect(errors).toHaveLength(1);
        });

        test("unique key violations", () => {
            const editableGridData = {
                "cellMessages": Map<string, CellMessage>({
                    "1-0": "description 1 message"
                }),
                "cellValues": Map<string, List<ValueDescriptor>>({
                    "0-0": List<ValueDescriptor>([
                        {
                            "display": "S-2",
                            "raw": "S-2"
                        }
                    ]),
                    "0-1": List<ValueDescriptor>([
                        {
                            "display": "S-2",
                            "raw": "S-2"
                        }
                    ]),
                    "0-2": List<ValueDescriptor>([
                        {
                            "display": "S-3",
                            "raw": "S-3"
                        }
                    ]),
                    "0-3": List<ValueDescriptor>([
                        {
                            "display": "S-4",
                            "raw": "S-4"
                        }
                    ]),
                    "0-4": List<ValueDescriptor>([
                        {
                            "display": "S-4",
                            "raw": "S-4"
                        }
                    ]),
                    "5-0": List<ValueDescriptor>([
                        {
                            "display": "requirement 1",
                            "raw": "requirement 1"
                        }
                    ]),
                    "5-1": List<ValueDescriptor>([
                        {
                            "display": "requirement 2",
                            "raw": "requirement 2"
                        }
                    ]),
                    "5-2": List<ValueDescriptor>([
                        {
                            "display": "requirement 3",
                            "raw": "requirement 3"
                        }
                    ]),
                    "5-3": List<ValueDescriptor>([
                        {
                            "display": "requirement 4",
                            "raw": "requirement 4"
                        }
                    ]),
                    "5-4": List<ValueDescriptor>([
                        {
                            "display": "requirement 5",
                            "raw": "requirement 5"
                        }
                    ]),
                }),
                "colCount": 5,
                "id": "insert-samples|samples\/sample set 2",
                "isPasting": false,
                "focusColIdx": 1,
                "focusRowIdx": 1,
                "numPastedRows": 0,
                "rowCount": 5,
                "selectedColIdx": 1,
                "selectedRowIdx": 1,
                "selectionCells": []
            };
            const editorModel = new EditorModel(editableGridData);
            const queryGridModel = new QueryGridModel( {
                schema: schemaQ.schemaName,
                query: schemaQ.queryName,
                id: 'insert-samples|samples/sample set 2',
                queryInfo: QueryInfo.fromJSON(sampleSet2QueryInfo),
                editable: true,
                data: Map<any, Map<string, any>>(
                    {
                        "1": Map<string, any>(),
                        "2": Map<string, any>(),
                        "3": Map<string, any>(),
                        "4": Map<string, any>(),
                        "5": Map<string, any>(),
                    }
                ),
                dataIds: List<any>([
                    "1", "2", "3", "4", "5"
                ])
            });
            const {uniqueKeyViolations, missingRequired} = editorModel.validateData(queryGridModel, "Name");
            expect(missingRequired.isEmpty()).toBe(true);
            expect(uniqueKeyViolations.size).toBe(1);
            expect(uniqueKeyViolations.has("Name")).toBe(true);
            expect(uniqueKeyViolations.get("Name").size).toBe(2);
            expect(uniqueKeyViolations.get("Name").has("S-2")).toBe(true);
            expect(uniqueKeyViolations.get("Name").get("S-2")).toEqual(List<number>([1, 2]));
            expect(uniqueKeyViolations.get("Name").has("S-4")).toBe(true);
            expect(uniqueKeyViolations.get("Name").get("S-4")).toEqual(List<number>([4, 5]));
            const errors = editorModel.getValidationErrors(queryGridModel, "Name");
            expect(errors).toHaveLength(2);
            expect(errors[0].indexOf("Duplicate")).toBeGreaterThanOrEqual(0);
            expect(errors[1].indexOf("Duplicate")).toBeGreaterThanOrEqual(0);
        });

        test("missing required and unique key violations", () => {
            const editableGridData = {
                "cellMessages": Map<string, CellMessage>({
                    "1-0": "description 1 message"
                }),
                "cellValues": Map<string, List<ValueDescriptor>>({
                    "0-0": List<ValueDescriptor>([
                        {
                            "display": "S-2",
                            "raw": "S-2"
                        }
                    ]),
                    "0-1": List<ValueDescriptor>([
                        {
                            "display": "S-2",
                            "raw": "S-2"
                        }
                    ]),
                    // missing Name for row index 2
                    "0-3": List<ValueDescriptor>([
                        {
                            "display": "S-4",
                            "raw": "S-4"
                        }
                    ]),
                    "0-4": List<ValueDescriptor>([
                        {
                            "display": "S-4",
                            "raw": "S-4"
                        }
                    ]),
                    "5-0": List<ValueDescriptor>([
                        {
                            "display": "requirement 1",
                            "raw": "requirement 1"
                        }
                    ]),
                    "5-1": List<ValueDescriptor>([
                        {
                            "display": "requirement 2",
                            "raw": "requirement 2"
                        }
                    ]),
                    "5-2": List<ValueDescriptor>([
                        {
                            "display": "requirement 3",
                            "raw": "requirement 3"
                        }
                    ]),
                    "5-3": List<ValueDescriptor>([
                        {
                            "display": "requirement 4",
                            "raw": "requirement 4"
                        }
                    ])
                    // missing RequiredData for row index 4
                }),
                "colCount": 5,
                "id": "insert-samples|samples\/sample set 2",
                "isPasting": false,
                "focusColIdx": 1,
                "focusRowIdx": 1,
                "numPastedRows": 0,
                "rowCount": 5,
                "selectedColIdx": 1,
                "selectedRowIdx": 1,
                "selectionCells": []
            };
            const editorModel = new EditorModel(editableGridData);
            const queryGridModel = new QueryGridModel( {
                schema: schemaQ.schemaName,
                query: schemaQ.queryName,
                id: 'insert-samples|samples/sample set 2',
                queryInfo: QueryInfo.fromJSON(sampleSet2QueryInfo),
                editable: true,
                data: Map<any, Map<string, any>>(
                    {
                        "1": Map<string, any>(),
                        "2": Map<string, any>(),
                        "3": Map<string, any>(),
                        "4": Map<string, any>(),
                        "5": Map<string, any>(),
                    }
                ),
                dataIds: List<any>([
                    "1", "2", "3", "4", "5"
                ])
            });
            const {uniqueKeyViolations, missingRequired} = editorModel.validateData(queryGridModel, "Name");
            expect(missingRequired.size).toBe(2);
            expect(missingRequired.has("Name")).toBe(true);
            expect(missingRequired.get("Name").size).toBe(1);
            expect(missingRequired.get("Name").contains(3)).toBe(true);
            expect(missingRequired.has("Required Data")).toBe(true);
            expect(missingRequired.get("Required Data").contains(5)).toBe(true);

            expect(uniqueKeyViolations.size).toBe(1);
            expect(uniqueKeyViolations.has("Name")).toBe(true);
            expect(uniqueKeyViolations.get("Name").size).toBe(2);
            expect(uniqueKeyViolations.get("Name").has("S-2")).toBe(true);
            expect(uniqueKeyViolations.get("Name").get("S-2")).toEqual(List<number>([1, 2]));
            expect(uniqueKeyViolations.get("Name").has("S-4")).toBe(true);
            expect(uniqueKeyViolations.get("Name").get("S-4")).toEqual(List<number>([4, 5]));
            const errors = editorModel.getValidationErrors(queryGridModel, "Name");
            expect(errors).toHaveLength(3);
        });
    });
});
