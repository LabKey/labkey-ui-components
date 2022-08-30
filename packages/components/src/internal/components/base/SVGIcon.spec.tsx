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
import { imageURL } from '../../url/ActionURL';

import { iconURL, Theme } from './SVGIcon';

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
