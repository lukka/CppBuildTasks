// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as ifacelib from '../../libs/base-lib/src/base-lib';
import * as os from 'os';

export const utilsMock: any = {
    setBaseLib(lib: ifacelib.BaseLib) {
        // Ensure the getArtifactsDir is mocked as follows.
        lib.getArtifactsDir = function (): string {
            return '/path/to/';
        }
        lib.getBinDir = function (): string {
            return "/path/to/";
        }
    },
    throwIfErrorCode(code: number) {
        if (code != 0) throw new Error('throwIfErrorCode throws');
        return 0;
    },
    isWin32(): boolean {
        return os.platform().includes('win32');
    },
    directoryExists(dir: string): boolean {
        return true;
    },
    writeFile(file: string, content: string) {
        console.log(`Writing to file '${file}' content '${content}'`);
    },
    getDefaultTriplet(): string {
        return "triplet";
    },
    fileExists(file: string) {
        return true;
    },
    extractTriplet(): string | null {
        return null;
    },
    setEnvVar(name: string, value: string) {
        //nothing to do
    },
    cachingFormatEnvName: 'AZP_CACHING_CONTENT_FORMAT',
    getVcpkgExePath(vcpkgRoot: string) {
        return '/path/to/vcpkg/vcpkg';
    },
    executableUpToDate(vcpkgRoot: string): boolean {
        return true;
    },
    trimString(str: string): string {
        return str?.trim() ?? "";
    },
    wrapOpSync(name: string, fn: () => any): any {
        return fn();
    },
    wrapOp(name: string, fn: () => any): any {
        return fn();
    }
};