// Copyright (c) 2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

export class Matcher {
    constructor(private name: string, private fromPath?: string) {
    }

    dispose(): void {
        // Intentionally void
    }
}

export const utilsMock: any = {
    wrapOpSync(name: string, fn: () => any): any {
        return fn();
    },
    wrapOp(name: string, fn: () => any): any {
        return fn();
    },
    createMatcher(name: string, fromPath?: string): any {
        return {
            dispose: function (): void {
                // Intentionally void.
            }
        };
    }
};
