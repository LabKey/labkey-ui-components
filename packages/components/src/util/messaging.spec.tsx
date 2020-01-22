import React from 'react';
import { resolveErrorMessage } from './messaging';

describe("resolveErrorMessage", () => {
    test("original is string", () => {
        expect(resolveErrorMessage("error string", "data", undefined, 'default message')).toBe("error string");
    });

    test("original is InsertRowsErrorResponse", () => {
        expect(resolveErrorMessage({exception: "exception message"}, "data", undefined, "default message")).toBe("exception message");
    });

    test("with message and exception", () => {
        expect(resolveErrorMessage({exception: "exception message", message: "other message"}, "test data", undefined)).toBe("other message");
    });

    test("duplicate key violation exception", () => {
        const error = {
            "exception" : "ERROR: duplicate key value violates unique constraint \"uq_material_lsid\"\n  Detail: Key (lsid)=(urn:lsid:labkey.com:Sample.252.Examples:E-20200121-743) already exists.\n  Where: SQL statement \"INSERT INTO exp.material (lsid, name, cpastype, runid, created, container, createdby, modifiedby, modified, lastindexed, description, objectid)\nSELECT $1.lsid, $1.Name, 'urn:lsid:labkey.com:SampleSet.Folder-252:Examples', $1.RunId, CURRENT_TIMESTAMP, '578a3330-dee0-1037-bdca-4e2bf136af84', 1005, 1005, CURRENT_TIMESTAMP, $1.LastIndexed, $1.Description, _$objectid$_\nRETURNING rowid\"\nPL/pgSQL function temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cf(temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cftype) line 10 at SQL statement",
            "extraContext" : { },
            "success" : false,
            "errors" : [ {
                "exception" : "ERROR: duplicate key value violates unique constraint \"uq_material_lsid\"\n  Detail: Key (lsid)=(urn:lsid:labkey.com:Sample.252.Examples:E-20200121-743) already exists.\n  Where: SQL statement \"INSERT INTO exp.material (lsid, name, cpastype, runid, created, container, createdby, modifiedby, modified, lastindexed, description, objectid)\nSELECT $1.lsid, $1.Name, 'urn:lsid:labkey.com:SampleSet.Folder-252:Examples', $1.RunId, CURRENT_TIMESTAMP, '578a3330-dee0-1037-bdca-4e2bf136af84', 1005, 1005, CURRENT_TIMESTAMP, $1.LastIndexed, $1.Description, _$objectid$_\nRETURNING rowid\"\nPL/pgSQL function temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cf(temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cftype) line 10 at SQL statement",
                "rowNumber" : 1,
                "errors" : [ {
                    "msg" : "ERROR: duplicate key value violates unique constraint \"uq_material_lsid\"\n  Detail: Key (lsid)=(urn:lsid:labkey.com:Sample.252.Examples:E-20200121-743) already exists.\n  Where: SQL statement \"INSERT INTO exp.material (lsid, name, cpastype, runid, created, container, createdby, modifiedby, modified, lastindexed, description, objectid)\nSELECT $1.lsid, $1.Name, 'urn:lsid:labkey.com:SampleSet.Folder-252:Examples', $1.RunId, CURRENT_TIMESTAMP, '578a3330-dee0-1037-bdca-4e2bf136af84', 1005, 1005, CURRENT_TIMESTAMP, $1.LastIndexed, $1.Description, _$objectid$_\nRETURNING rowid\"\nPL/pgSQL function temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cf(temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cftype) line 10 at SQL statement",
                    "message" : "ERROR: duplicate key value violates unique constraint \"uq_material_lsid\"\n  Detail: Key (lsid)=(urn:lsid:labkey.com:Sample.252.Examples:E-20200121-743) already exists.\n  Where: SQL statement \"INSERT INTO exp.material (lsid, name, cpastype, runid, created, container, createdby, modifiedby, modified, lastindexed, description, objectid)\nSELECT $1.lsid, $1.Name, 'urn:lsid:labkey.com:SampleSet.Folder-252:Examples', $1.RunId, CURRENT_TIMESTAMP, '578a3330-dee0-1037-bdca-4e2bf136af84', 1005, 1005, CURRENT_TIMESTAMP, $1.LastIndexed, $1.Description, _$objectid$_\nRETURNING rowid\"\nPL/pgSQL function temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cf(temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cftype) line 10 at SQL statement"
                } ]
            } ],
            "errorCount" : 1
        };
        expect(resolveErrorMessage(error, "samples", undefined)).toBe("There was a problem creating your samples.  Check the existing samples for possible duplicates and make sure any referenced samples are still valid.")
    });

    test("Existing row now found", () => {
        // TODO need to capture this in the wild
    });

    test("Communication error", () => {
        // TODO need to capture this in the wild.
    });
});
