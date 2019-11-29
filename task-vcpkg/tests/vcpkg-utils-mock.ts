// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

export const utilsMock: any = {
    setIBaseLib() {
        // nothing to do.
    },
    getBinDir() {
        return '/path/to/';
    },
    throwIfErrorCode(code: number) {
        if (code != 0) throw new Error('throwIfErrorCode throws');
        return 0;
    },
    isWin32(): boolean {
        return false;
    },
    directoryExists(dir: string) {
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
    vcpkgRootEnvName: 'VCPKG_ROOT',
    cachingFormatEnvName: 'AZP_CACHING_CONTENT_FORMAT'
};