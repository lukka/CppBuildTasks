// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as stream from 'stream';
import { IToolRunner, IBaseLib, IExecResult, IExecOptions } from './base-lib';
import * as tl from 'azure-pipelines-task-lib/task';
import * as trm from 'azure-pipelines-task-lib/toolrunner';
import * as fs from 'fs';

export namespace libtask {

  export class ToolRunner implements IToolRunner {
    private readonly toolRunner: trm.ToolRunner;

    constructor(private path: string) {
      // Do not create a new trm.ToolRunner here explicitly thru 'new', but
      // create it thru 'tl.tool()' function instead. This way it will be mocked
      // correctly when running tests.
      this.toolRunner = tl.tool(path);
    }

    exec(options: IExecOptions): Promise<number> {
      const options2: trm.IExecOptions = this.convertExecOptions(options);
      options2.cwd = options.cwd;

      return Promise.resolve(this.toolRunner.exec(options));
    }

    line(val: string): void {
      this.toolRunner.line(val);
    }

    arg(val: string | string[]): void {
      this.toolRunner.arg(val);
    }

    execSync(options?: IExecOptions): Promise<IExecResult> {
      let res: trm.IExecSyncResult = this.toolRunner.execSync(options);
      let res2: IExecResult = <IExecResult>{
        stdout: res.stdout,
        stderr: res.stderr,
        code: res.code,
        error: res.error
      };

      return Promise.resolve(res2);
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

  export class TaskLib implements IBaseLib {
    getInput(name: string, required: boolean): string | undefined {
      return tl.getInput(name, required);
    }

    getPathInput(name: string): string | undefined {
      return tl.getPathInput(name);
    }

    getDelimitedInput(name: string, delim: string, required: boolean): string[] {
      return tl.getDelimitedInput(name, delim, required);
    }

    setVariable(name: string, value: string): void {
      tl.setVariable(name, value);
    }

    getVariable(name: string): string | undefined {
      return tl.getVariable(name);
    }

    debug(message: string): void {
      tl.debug(message);
    }

    error(message: string): void {
      tl.error(message);
    }

    warning(message: string): void {
      tl.warning(message);
    }

    loc(message: string, ...param: any[]): string {
      return tl.loc(message, param);
    }

    tool(name: string): IToolRunner {
      return new ToolRunner(name);
    }

    exec(name: string, args: any, options?: IExecOptions): Promise<number> {
      return Promise.resolve(tl.exec(name, args, options));
    }

    execSync(name: string, args: any, options?: IExecOptions): Promise<IExecResult> {
      var res = tl.execSync(name, args, options);
      let res2: IExecResult = <IExecResult>{
        code: res.code,
        stdout: res.stdout,
        stderr: res.stderr,
        error: res.error
      }

      return Promise.resolve(res2);
    }

    which(name: string, required: boolean): Promise<string> {
      const res = tl.which(name, required);
      return Promise.resolve(res);
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
      return Promise.resolve(tl.exist(path));
    }
  }
}