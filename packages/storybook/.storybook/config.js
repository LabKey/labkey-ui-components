/*
 * Copyright (c) 2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import { configure } from '@storybook/react'

// See https://storybook.js.org/docs/basics/writing-stories/ for info on loading stories dynamically.
// This fails currently because, I think, the packages themselves don't know how to handle (or, better, ignore)
// the files named *.stories.js.
//
// WARNING in ../grid/src/Grid.stories.js 11:8
// Module parse failed: Unexpected token (11:8)
// You may need an appropriate loader to handle this file type.
// |     .addDecorator(withKnobs)
// |     .add('With basic data', withMarkdownNotes(constants.gridWithBasicDataMD)(() =>
//     >         <Grid data={constants.gridData} />))
// |     .add('With columns', withMarkdownNotes(constants.gridWithColumnsMD)(() =>
//     |         <Grid data={constants.gridData} columns={constants.gridColumns} />))
// @ .. sync \.stories\.js$ ./grid/src/Grid.stories.js
// @ ./.storybook/config.js
// @ multi /Users/susanhert/Development/labkey/glass-components/node_modules/@storybook/core/dist/server/common/polyfills.js /Users/susanhert/Development/labkey/glass-components/node_modules/@storybook/core/dist/server/preview/globals.js ./.storybook/config.js (webpack)-hot-middleware/client.js?reload=true
// const req = require.context('../../../packages', true, /\.stories\.js$/);

function loadStories() {
    require('../src/stories/index.js');
    // require additional stories here
    // req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);