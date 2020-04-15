// Copyright (c) 2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as os from 'os';

export const utilsMock: any = {
  wrapOpSync(name: string, fn: () => any): any {
        return fn();
    },
    wrapOp(name: string, fn: () => any): any {
        return fn();
    }
};