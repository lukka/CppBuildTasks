// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as stream from 'stream';
import { IToolRunner, IBaseLib, IExecResult, IExecOptions } from './base-lib';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as ioutil from '@actions/io/lib/io-util';
import * as io from '@actions/io/lib/io';
import * as fs from 'fs';
import * as path from 'path';
import * as shelljs from 'shelljs'

export namespace libaction {

  export class ToolRunner implements IToolRunner {

    private args: string[];

    constructor(private path: string) {
    }

    exec(options: IExecOptions): Promise<number> {
      const options2: IExecOptions = this.convertExecOptions(options);

      return exec.exec(this.path, this.args, options);
    }

    line(val: string): void {
      this.args = [val];
    }

    arg(val: string | string[]): void {
      if (val instanceof Array) {
        this.args = this.args.concat(val);
      }

      else if (typeof (val) === 'string') {
        this.args = this.args.concat(val.trim());
      }
    }

    async execSync(options?: IExecOptions): Promise<IExecResult> {
      var exitCode: number = await exec.exec(this.path, this.args, options);
      let res2: IExecResult = <IExecResult>{
        code: exitCode
      };

      return Promise.resolve(res2);
    }

    private convertExecOptions(options: IExecOptions): IExecOptions {
      let result: IExecOptions = <IExecOptions>{
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

    async execSync(name: string, args: any, options?: IExecOptions): Promise<IExecResult> {
      var exitCode: number = await exec.exec(name, args, options);
      let res2: IExecResult = <IExecResult>{
        code: exitCode
      }

      return Promise.resolve(res2);
    }

    async which(name: string, required: boolean): Promise<string> {
      return io.which(name, required);
    }

    rmRF(path: string): void {
      io.rmRF(path);
    }

    mkdirP(path: string): void {
      io.mkdirP(path);
    }

    cd(path: string): void {
      shelljs.cd(path);
    }

    writeFile(path: string, content: string): void {
      fs.writeFileSync(path, content);
    }

    resolve(apath: string): string {
      return path.resolve(apath);
    }

    stats(path: string): fs.Stats {
      return fs.statSync(path);
    }

    exist(path: string): Promise<boolean> {
      return ioutil.exists(path);
    }
  }
}