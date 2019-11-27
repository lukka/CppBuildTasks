// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as stream from 'stream';
import * as fs from 'fs';

export interface IToolRunner {
  exec(options: IExecOptions): Promise<number>;
  line(line: string): void;
  arg(val: string | string[]): void;
  execSync(options?: IExecOptions): Promise<IExecResult>;
}

export interface IBaseLib {
  getInput(name: string, required: boolean): string | undefined;
  getPathInput(name: string): string | undefined;
  getDelimitedInput(name: string, delim: string, required: boolean): string[];
  setVariable(name: string, value: string): void;
  getVariable(name: string): string | undefined;
  debug(message: string): void;
  error(message: string): void;
  warning(message: string): void;
  loc(message: string, ...param: any[]): string;
  tool(name: string): IToolRunner;
  exec(name: string, args: any, options?: IExecOptions): Promise<number>;
  execSync(name: string, args: any, options?: IExecOptions): Promise<IExecResult>;
  which(name: string, required: boolean): Promise<string>;
  rmRF(path: string): void;
  mkdirP(path: string): void;
  cd(path: string): void;
  writeFile(path: string, content: string): void;
  resolve(path: string): string;
  stats(path: string): fs.Stats;
  exist(path: string): Promise<boolean>;
}

export interface IExecOptions {
  cwd: string;
  failOnStdErr: boolean;
  ignoreReturnCode: boolean;
  silent: boolean;
  windowsVerbatimArguments: boolean;
  env: {
    [key: string]: string;
  };
  outStream: stream.Writable;
  errStream: stream.Writable;
}

export interface IExecResult {
  stdout: string;
  stderr: string;
  code: number;
  error: Error;
}
