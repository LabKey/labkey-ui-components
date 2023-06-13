/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { AuditDetailsModel } from './models';

describe('AuditDetailsModel', () => {
    const EMPTY_MODEL = AuditDetailsModel.create({});
    const NEW_MODEL = AuditDetailsModel.create({ newData: [{ test: 1 }] });
    const OLD_MODEL = AuditDetailsModel.create({ oldData: [{ test: 1 }] });
    const BOTH_MODEL_OLD = AuditDetailsModel.create({ oldData: [{ test: 1 }], newData: [] });
    const BOTH_MODEL_NEW = AuditDetailsModel.create({ oldData: [], newData: [{ test: 1 }] });
    const BOTH_MODEL = AuditDetailsModel.create({ oldData: [{ test: 1 }], newData: [{ test: 1 }] });

    test('isUpdate', () => {
        expect(EMPTY_MODEL.isUpdate()).toBeFalsy();
        expect(NEW_MODEL.isUpdate()).toBeFalsy();
        expect(OLD_MODEL.isUpdate()).toBeFalsy();
        expect(BOTH_MODEL_OLD.isUpdate()).toBeFalsy();
        expect(BOTH_MODEL_NEW.isUpdate()).toBeFalsy();
        expect(BOTH_MODEL.isUpdate()).toBeTruthy();
    });

    test('isInsert', () => {
        expect(EMPTY_MODEL.isInsert()).toBeFalsy();
        expect(NEW_MODEL.isInsert()).toBeFalsy();
        expect(OLD_MODEL.isInsert()).toBeFalsy();
        expect(BOTH_MODEL_OLD.isInsert()).toBeFalsy();
        expect(BOTH_MODEL_NEW.isInsert()).toBeTruthy();
        expect(BOTH_MODEL.isInsert()).toBeFalsy();
    });

    test('isDelete', () => {
        expect(EMPTY_MODEL.isDelete()).toBeFalsy();
        expect(NEW_MODEL.isDelete()).toBeFalsy();
        expect(OLD_MODEL.isDelete()).toBeFalsy();
        expect(BOTH_MODEL_OLD.isDelete()).toBeTruthy();
        expect(BOTH_MODEL_NEW.isDelete()).toBeFalsy();
        expect(BOTH_MODEL.isDelete()).toBeFalsy();
    });

    test('getActionLabel', () => {
        expect(EMPTY_MODEL.getActionLabel()).toBe('Updated');
        expect(NEW_MODEL.getActionLabel()).toBe('Updated');
        expect(OLD_MODEL.getActionLabel()).toBe('Updated');
        expect(BOTH_MODEL_OLD.getActionLabel()).toBe('Deleted');
        expect(BOTH_MODEL_NEW.getActionLabel()).toBe('Created');
        expect(BOTH_MODEL.getActionLabel()).toBe('Updated');
    });
});
