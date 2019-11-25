// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as q from 'q';
import * as stream from 'stream';
import { IToolRunner, ITaskLib, IExecResult, IExecOptions } from './base-lib';
import * as core from '@actions/core';
import * as github from '@actions/github';
import * as exec from '@actions/exec';
import * as ioutil from '@actions/io/lib/io-util';
import * as io from '@actions/io/lib/io';
import * as fs from 'fs';
import { clearInputs } from '../../task-cmake/tests/test-utils';

export namespace libaction {

  export class ToolRunner implements IToolRunner {
    private readonly toolRunner: ToolRunner;

    constructor(private path: string) {
    }

    exec(options: IExecOptions): q.Promise<number> {
      const options2: trm.IExecOptions = this.convertExecOptions(options);
      options2.cwd = options.cwd;

      return this.toolRunner.exec(options);
    }

    line(val: string): void {
      this.toolRunner.line(val);
    }

    arg(val: string | string[]): void {
      this.toolRunner.arg(val);
    }

    execSync(options?: IExecOptions): q.Promise<IExecResult> {
      var defer = q.defer<IExecResult>();

      let res: trm.IExecSyncResult = this.toolRunner.execSync(options);
      let res2: IExecResult = <IExecResult>{
        stdout: res.stdout,
        stderr: res.stderr,
        code: res.code,
        error: res.error
      };

      defer.resolve(res2);
      return defer.promise;
    }

    private convertExecOptions(options: IExecOptions): trm.IExecOptions {
      let result: trm.IExecOptions = <trm.IExecOptions>{
        cwd: options.cwd ?? process.cwd(),
        env: options.env ?? process.env,
        silent: options.silent ?? false,
        failOnStdErr: options.failOnStdErr ?? false,
        ignoreReturnCode: options.ignoreReturnCode ?? false,
        windowsVerbatimArguments: options.windowsVerbatimArguments ?? false
      };
      result.outStream = options.outStream || <stream.Writable>process.stdout;
      result.errStream = options.errStream || <stream.Writable>process.stderr;
      return result;
    }
  }

  export class TaskLib implements ITaskLib {
    getInput(name: string, isRequired: boolean): string {
      return core.getInput(name, { required: isRequired });
    }

    getPathInput(name: string): string {
      return core.getInput(name);
    }

    getDelimitedInput(name: string, delim: string, required: boolean): string[] {
      const input = core.getInput(name, { required: required });
      let inputs: string[] = input.split(delim);
      return inputs;
    }

    setVariable(name: string, value: string): void {
      core.exportVariable(name, value);
    }

    getVariable(name: string): string {
      //?? Is it really fine to return an empty string in case of undefined variable?
      return process.env[name] ?? "";
    }

    debug(message: string): void {
      core.debug(message);
    }

    error(message: string): void {
      core.error(message);
    }

    warning(message: string): void {
      core.warning(message);
    }

    loc(message: string, ...param: any[]): string {
      return message;
    }

    tool(name: string): IToolRunner {
      return new ToolRunner(name);
    }

    exec(name: string, args: any, options?: IExecOptions): Promise<number> {
      return Promise.resolve(exec.exec(name, args, options));
    }

    execSync(name: string, args: any, options?: IExecOptions): IExecResult {
      var res = tl.execSync(name, args, options);
      let res2: IExecResult = <IExecResult>{
        code: res.code,
        stdout: res.stdout,
        stderr: res.stderr,
        error: res.error
      }

      return res2;
    }

    async which(name: string, required: boolean): Promise<string> {
      return io.which(name, required);
    }

    rmRF(path: string): void {
      tl.rmRF(path);
    }

    mkdirP(path: string): void {
      tl.mkdirP(path);
    }

    cd(path: string): void {
      tl.cd(path);
    }

    writeFile(path: string, content: string): void {
      tl.writeFile(path, content);
    }

    resolve(path: string): string {
      return tl.resolve(path);
    }

    stats(path: string): fs.Stats {
      return tl.stats(path);
    }

    exist(path: string): Promise<boolean> {
      return ioutil.exists(path);
    }
  }
}