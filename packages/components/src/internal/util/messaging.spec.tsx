import { resolveErrorMessage } from './messaging';

describe('resolveErrorMessage', () => {
    test('original is string', () => {
        expect(resolveErrorMessage('error string', 'data', undefined, 'default message')).toBe('error string');
    });

    test('original is InsertRowsErrorResponse', () => {
        expect(resolveErrorMessage({ exception: 'exception message' }, 'data', undefined, 'default message')).toBe(
            'exception message'
        );
    });

    test('with message and exception', () => {
        expect(
            resolveErrorMessage({ exception: 'exception message', message: 'other message' }, 'test data', undefined)
        ).toBe('other message');
    });

    test('duplicate key violation exception - alternate resolution', () => {
        const resolver = (errorMsg: string, noun: string): string => {
            return 'Some interference detected with your ' + noun + '.';
        };

        const error = {
            exception:
                'ERROR: duplicate key value violates unique constraint "uq_item_boxid_row_col"\n' +
                '  Detail: Key (boxid, "row", col)=(24566, 1, 1) already exists.',
            extraContext: {},
            success: false,
            errors: [
                {
                    exception:
                        'ERROR: duplicate key value violates unique constraint "uq_item_boxid_row_col"\n' +
                        '  Detail: Key (boxid, "row", col)=(24566, 1, 1) already exists.',
                    rowNumber: 1,
                    errors: [{}],
                },
            ],
            errorCount: 1,
        };
        expect(resolveErrorMessage(error, 'samples', undefined, undefined, resolver)).toBe(
            'Some interference detected with your samples.'
        );
    });

    test('duplicate key violation exception - Postgres', () => {
        const error = {
            exception:
                'ERROR: duplicate key value violates unique constraint "uq_material_lsid"\n  Detail: Key (container, cpastype, name)=(02dd731c-0767-103a-8c98-02a6963667d0, urn:lsid:labkey.com:SampleSet.Folder-6:Blood, B1-247) already exists.\n  Where: SQL statement "INSERT INTO exp.material (lsid, name, cpastype, runid, created, container, createdby, modifiedby, modified, lastindexed, description, objectid)\nSELECT $1.lsid, $1.Name, \'urn:lsid:labkey.com:SampleSet.Folder-252:Examples\', $1.RunId, CURRENT_TIMESTAMP, \'578a3330-dee0-1037-bdca-4e2bf136af84\', 1005, 1005, CURRENT_TIMESTAMP, $1.LastIndexed, $1.Description, _$objectid$_\nRETURNING rowid"\nPL/pgSQL function temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cf(temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cftype) line 10 at SQL statement',
            extraContext: {},
            success: false,
            errors: [
                {
                    exception:
                        'ERROR: duplicate key value violates unique constraint "uq_material_lsid"\n  Detail: Key Key (container, cpastype, name)=(02dd731c-0767-103a-8c98-02a6963667d0, urn:lsid:labkey.com:SampleSet.Folder-6:Blood, B1-247) already exists.\n  Where: SQL statement "INSERT INTO exp.material (lsid, name, cpastype, runid, created, container, createdby, modifiedby, modified, lastindexed, description, objectid)\nSELECT $1.lsid, $1.Name, \'urn:lsid:labkey.com:SampleSet.Folder-252:Examples\', $1.RunId, CURRENT_TIMESTAMP, \'578a3330-dee0-1037-bdca-4e2bf136af84\', 1005, 1005, CURRENT_TIMESTAMP, $1.LastIndexed, $1.Description, _$objectid$_\nRETURNING rowid"\nPL/pgSQL function temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cf(temp.fn_cb4838bd5008e21ca0ebb3e8d366d2cftype) line 10 at SQL statement',
                    rowNumber: 1,
                    errors: [{}],
                },
            ],
            errorCount: 1,
        };
        expect(resolveErrorMessage(error, 'samples', undefined)).toBe(
            "There was a problem creating your samples. Duplicate name 'B1-247' found."
        );
    });

    test('duplicate key violation exception with commas - Postgres', () => {
        const error = {
            exception:
                'ERROR: duplicate key value violates unique constraint "idx_material_ak"\n  Detail: Key (container, cpastype, name)=(02dd731c-0767-103a-8c98-02a6963667d0, urn:lsid:labkey.com:SampleSet.Folder-6:With%2C+and+without%2C+Commas, WC-1,2,204) already exists.',
            extraContext: {},
            success: false,
            errors: [
                {
                    exception:
                        'ERROR: duplicate key value violates unique constraint "idx_material_ak"\n  Detail: Key (container, cpastype, name)=(02dd731c-0767-103a-8c98-02a6963667d0, urn:lsid:labkey.com:SampleSet.Folder-6:With%2C+and+without%2C+Commas, WC-1,2,204) already exists.',
                    rowNumber: 1,
                    errors: [{}],
                },
            ],
            errorCount: 1,
        };
        expect(resolveErrorMessage(error, 'samples', undefined)).toBe(
            "There was a problem creating your samples. Duplicate name 'WC-1,2,204' found."
        );
    });

    test('duplicate key violation exception with commas and spaces - Postgres', () => {
        const error = {
            exception:
                'ERROR: duplicate key value violates unique constraint "idx_material_ak"\n  Detail: Key (container, cpastype, name)=(02dd731c-0767-103a-8c98-02a6963667d0, urn:lsid:labkey.com:SampleSet.Folder-6:With%2C+and+without%2C+Commas, WC-1, 2,204) already exists.',
            extraContext: {},
            success: false,
            errors: [
                {
                    exception:
                        'ERROR: duplicate key value violates unique constraint "idx_material_ak"\n  Detail: Key (container, cpastype, name)=(02dd731c-0767-103a-8c98-02a6963667d0, urn:lsid:labkey.com:SampleSet.Folder-6:With%2C+and+without%2C+Commas, WC-1, 2,204) already exists.',
                    rowNumber: 1,
                    errors: [{}],
                },
            ],
            errorCount: 1,
        };
        expect(resolveErrorMessage(error, 'samples', undefined)).toBe(
            "There was a problem creating your samples. Duplicate name 'WC-1, 2,204' found."
        );
    });

    test('duplicate key violation exception source key - Postgres', () => {
        const error = {
            exception:
                'ERROR: duplicate key value violates unique constraint "uq_data_dataclass_name"\n' +
                '              Detail: Key (classid, name)=(46, L-40) already exists.\n' +
                '              Where: SQL statement "INSERT INTO exp.data (lsid, name, cpastype, datafileurl, container, created, createdby, modified, modifiedby, description, classid, lastindexed, objectid)',
            extraContext: {},
            success: false,
            errors: [
                {
                    exception:
                        'ERROR: duplicate key value violates unique constraint "uq_data_dataclass_name"\n' +
                        '              Detail: Key (classid, name)=(46, L-40) already exists.\n' +
                        '              Where: SQL statement "INSERT INTO exp.data (lsid, name, cpastype, datafileurl, container, created, createdby, modified, modifiedby, description, classid, lastindexed, objectid)',
                    rowNumber: 1,
                    errors: [{}],
                },
            ],
            errorCount: 1,
        };
        expect(resolveErrorMessage(error, 'sources', undefined)).toBe(
            "There was a problem creating your sources. Duplicate name 'L-40' found."
        );
    });

    test('duplicate key violation exception source key with commas - Postgres', () => {
        const error = {
            exception:
                'ERROR: duplicate key value violates unique constraint "uq_data_dataclass_name"\n' +
                '              Detail: Key (classid, name)=(46, L-40,1) already exists.\n' +
                '              Where: SQL statement "INSERT INTO exp.data (lsid, name, cpastype, datafileurl, container, created, createdby, modified, modifiedby, description, classid, lastindexed, objectid)',
            extraContext: {},
            success: false,
            errors: [
                {
                    exception:
                        'ERROR: duplicate key value violates unique constraint "uq_data_dataclass_name"\n' +
                        '              Detail: Key (classid, name)=(46, L-40,1) already exists.\n' +
                        '              Where: SQL statement "INSERT INTO exp.data (lsid, name, cpastype, datafileurl, container, created, createdby, modified, modifiedby, description, classid, lastindexed, objectid)',
                    rowNumber: 1,
                    errors: [{}],
                },
            ],
            errorCount: 1,
        };
        expect(resolveErrorMessage(error, 'sources', undefined)).toBe(
            "There was a problem creating your sources. Duplicate name 'L-40,1' found."
        );
    });

    test('duplicate key violation exception source key with commas and spaces - Postgres', () => {
        const error = {
            exception:
                'ERROR: duplicate key value violates unique constraint "uq_data_dataclass_name"\n' +
                '              Detail: Key (classid, name)=(46, L-40, 1) already exists.\n' +
                '              Where: SQL statement "INSERT INTO exp.data (lsid, name, cpastype, datafileurl, container, created, createdby, modified, modifiedby, description, classid, lastindexed, objectid)',
            extraContext: {},
            success: false,
            errors: [
                {
                    exception:
                        'ERROR: duplicate key value violates unique constraint "uq_data_dataclass_name"\n' +
                        '              Detail: Key (classid, name)=(46, L-40, 1) already exists.\n' +
                        '              Where: SQL statement "INSERT INTO exp.data (lsid, name, cpastype, datafileurl, container, created, createdby, modified, modifiedby, description, classid, lastindexed, objectid)',
                    rowNumber: 1,
                    errors: [{}],
                },
            ],
            errorCount: 1,
        };
        expect(resolveErrorMessage(error, 'sources', undefined)).toBe(
            "There was a problem creating your sources. Duplicate name 'L-40, 1' found."
        );
    });

    test('Duplicate single-field key - Postgres', () => {
        const error = {
            exception:
                'ERROR: duplicate key value violates unique constraint "c7094d54716_st_sample_move_name"\n Detail: Key (name)=(PtoC2-0) already exists.',
            extraContext: {},
            success: false,
            errors: [
                {
                    exception:
                        'ERROR: duplicate key value violates unique constraint "c7094d54716_st_sample_move_name"\n  Detail: Key (name)=(PtoC2-0) already exists.',
                    errors: {
                        _form: 'ERROR: duplicate key value violates unique constraint "c7094d54716_st_sample_move_name"\n  Detail: Key (name)=(PtoC2-0) already exists.',
                    },
                },
            ],
            errorCount: 1,
        };
        expect(resolveErrorMessage(error, 'samples', undefined)).toBe(
            "There was a problem creating your samples. Duplicate name 'PtoC2-0' found."
        );
    });

    test('Existing row now found', () => {
        const error = {
            exception: 'The existing row was not found.',
            exceptionClass: 'org.labkey.api.view.NotFoundException',
        };
        expect(resolveErrorMessage(error, 'frog', undefined, 'update')).toBe(
            'We could not find the frog to update.  Try refreshing your page to see if it has been deleted.'
        );
    });

    test('Communication error', () => {
        const error = {
            exception: 'Communication failure',
        };
        expect(resolveErrorMessage(error, 'octopus')).toBe(
            'There was a problem retrieving your octopus. Your session may have expired or the octopus may no longer be valid.  Try refreshing your page.'
        );
    });

    test('No model found', () => {
        const error = {
            exception: "Query 'delete it' in schema 'samples' doesn't exist.",
            exceptionClass: 'org.labkey.api.view.NotFoundException',
        };
        expect(resolveErrorMessage(error, undefined)).toBe(
            'There was a problem retrieving your data. Your session may have expired or the data may no longer be valid.  Try refreshing your page.'
        );
    });

    test('IllegalArgumentException', () => {
        const error = {
            msg:
                "java.lang.IllegalArgumentException: Can't create new name using the name expression: P-${genId}-${blah}",
            message:
                "java.lang.IllegalArgumentException: Can't create new name using the name expression: P-${genId}-${blah}",
        };
        expect(resolveErrorMessage(error, undefined)).toBe(
            "Can't create new name using the name expression: P-${genId}-${blah}"
        );
    });

    test('NullPointerException', () => {
        const error = {
            msg: 'java.lang.NullPointerException',
            message: 'java.lang.NullPointerException',
        };
        expect(resolveErrorMessage(error, undefined)).toBe(
            'There was a problem processing your data. This may be a problem in the application. Contact your administrator.'
        );
        expect(resolveErrorMessage(error, 'sample')).toBe(
            'There was a problem processing your sample. This may be a problem in the application. Contact your administrator.'
        );
        expect(resolveErrorMessage(error, 'sample', 'samples', 'importing')).toBe(
            'There was a problem importing your sample. This may be a problem in the application. Contact your administrator.'
        );
    });

    test('Class cast exception', () => {
        const error = {
            msg: "class java.lang.String cannot be cast to class java.util.Date (java.lang.String and java.util.Date are in module java.base of loader 'bootstrap')",
            message: "class java.lang.String cannot be cast to class java.util.Date (java.lang.String and java.util.Date are in module java.base of loader 'bootstrap')",
        };
        expect(resolveErrorMessage(error)).toBe(
            'There was a problem creating your data.  Check that the format of the data matches the expected type for each field.'
        );
        expect(resolveErrorMessage(error, 'sample')).toBe(
            'There was a problem creating your sample.  Check that the format of the data matches the expected type for each field.'
        );
    });
});
