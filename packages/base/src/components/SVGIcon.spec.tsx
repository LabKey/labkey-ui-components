/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { imageURL } from '../url/ActionURL'
import { iconURL, Theme } from './SVGIcon'

describe('iconURL', () => {

    const iconDir = 'testDir';
    const sourceToken = '<SOURCE>';
    const baseImageURL = imageURL(iconDir, sourceToken).split(sourceToken)[0];
    const iconSuffix = '.svg';

    function iconURLfromPart(part: string): string {
        return baseImageURL + part + iconSuffix;
    }

    test('Should handle invalid prefix', () => {
        const defaultURL = iconURLfromPart('default');

        expect(iconURL(iconDir, undefined)).toEqual(defaultURL);
        expect(iconURL(iconDir, null)).toEqual(defaultURL);
        expect(iconURL(iconDir, [] as any)).toEqual(defaultURL);
        expect(iconURL(iconDir, ['foo'] as any)).toEqual(defaultURL);
        expect(iconURL(iconDir, 12 as any)).toEqual(defaultURL);

        expect(iconURL(iconDir, undefined, Theme.ORANGE)).toEqual(iconURLfromPart('default_orange'));
    });

    test('Should handle invalid theme', () => {
        const prefix = 'default';
        const defaultURL = iconURLfromPart('default');

        expect(iconURL(iconDir, prefix, undefined)).toEqual(defaultURL);
        expect(iconURL(iconDir, prefix, null)).toEqual(defaultURL);
        expect(iconURL(iconDir, prefix, ['foo'] as any)).toEqual(defaultURL);
    });

    test('Should generate icon URLs for known Themes', () => {
        const prefix = 'default';

        // Theme.DEFAULT does not get parsed into the URL
        expect(iconURL(iconDir, prefix, Theme.DEFAULT)).toEqual(iconURLfromPart(prefix));

        // other themes do
        expect(iconURL(iconDir, prefix, Theme.GRAY)).toEqual(iconURLfromPart(prefix + '_gray'));
        expect(iconURL(iconDir, prefix, Theme.LIGHT)).toEqual(iconURLfromPart(prefix + '_light'));
        expect(iconURL(iconDir, prefix, Theme.ORANGE)).toEqual(iconURLfromPart(prefix + '_orange'));
    });
});