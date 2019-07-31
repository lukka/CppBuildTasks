export const utilsMock: any = {
    getBinDir() {
        return '/path/to/';
    },
    throwIfErrorCode(code: Number) {
        if (code != 0) throw new Error('throwIfErrorCode throws');
        return 0;
    },
    isWin32(): boolean {
        return false;
    },
    directoryExists(dir: string) {
        return true;
    },
    readFile(file: string) {
        return [false, "https://github.com/Microsoft/vcpkg.git"];
    },
    getDefaultTriplet(): string {
        return "triplet";
    },
    fileExists(file: string) {
        return true;
    },
    extractTriplet(): string | null {
        return null;
    }
};