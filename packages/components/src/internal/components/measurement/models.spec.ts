import {UnitModel} from "./models";

describe("UnitModel", () => {

    test("constructor and operators", () => {
        expect(new UnitModel(10, null).toString()).toBe('10');
        expect(new UnitModel(10, 'mL').toString()).toBe('10 mL');

        expect(new UnitModel(99999, 'uL').as('L').toString()).toBe('0.099999 L');
        expect(new UnitModel(99999.133, 'uL').as('L').toString()).toBe('0.099999 L');
        expect(new UnitModel(10, 'mL').as('L').toString()).toBe('0.01 L');
        expect(new UnitModel(10, 'mL').add(10, 'uL').toString()).toBe('10.01 mL');
        expect(new UnitModel(undefined, 'mL').as('L').toString()).toBe("0 L");

        expect(new UnitModel(10, 'mL').compareTo(new UnitModel(9, 'mL')) > 0).toBeTruthy();
        expect(new UnitModel(10, 'mL').compareTo(new UnitModel(9, 'L')) > 0).toBeFalsy();
        expect(new UnitModel(10, 'mL').compareTo(new UnitModel(undefined, 'L')) > 0).toBeFalsy();
        expect(new UnitModel(undefined, 'mL').compareTo(new UnitModel(9, 'L')) > 0).toBeFalsy();
        expect(new UnitModel(undefined, 'mL').compareTo(new UnitModel(undefined, 'L')) > 0).toBeFalsy();
    });

})
