/*
 * Copyright (c) 2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import { configure } from '@storybook/react'

function loadStories() {
    require('../src/stories/index.js');
    // require additional stories here
}

configure(loadStories, module);