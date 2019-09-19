import { Map } from 'immutable'
import { QueryInfo } from "@glass/base";
import { getBackupImageFromLineageNode, getImageFromLineageNode, getImageNameWithTheme } from "./utils";
import { LineageNode, LineageNodeMetadata } from "./models";

describe("lineage utils", () => {

    test("getImageNameWithTheme", () => {
        expect(getImageNameWithTheme('test', false, false)).toBe('test_gray.svg');
        expect(getImageNameWithTheme('test', true, false)).toBe('test.svg');
        expect(getImageNameWithTheme('test', false, true)).toBe('test_orange.svg');
        expect(getImageNameWithTheme('test', true, true)).toBe('test_orange.svg');
    });

    test("getImageFromLineageNode", () => {
        let lineageNode = LineageNode.create('test', {});
        expect(getImageFromLineageNode(lineageNode, false, false)).toBe('/labkey/_images/default_gray.svg');

        lineageNode = lineageNode.set('meta', LineageNodeMetadata.create(Map<any, any>(), QueryInfo.create({iconURL: 'other'})));
        expect(getImageFromLineageNode(lineageNode, false, false)).toBe('/labkey/_images/other_gray.svg');
    });

    test("getBackupImageFromLineageNode", () => {
        let lineageNode = LineageNode.create('test', {cpasType: 'Test'});
        expect(getBackupImageFromLineageNode(lineageNode, false, false)).toBe('https://labkey.org/_images/default_gray.svg');

        lineageNode = LineageNode.create('test', {cpasType: 'SampleSet'});
        expect(getBackupImageFromLineageNode(lineageNode, false, false)).toBe('https://labkey.org/_images/samples_gray.svg');
    });

});