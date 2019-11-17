// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as tl from 'azure-pipelines-task-lib/task';
import * as trm from 'azure-pipelines-task-lib/toolrunner';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as utils from './utils'
import * as stripJsonComments from 'strip-json-comments';
import * as ninjalib from './ninja';

export interface EnvironmentMap { [name: string]: Environment; }

class CMakeVariable {
  constructor(public name: string, public value: string, public type: string) { }

  public toString(): string {
    if (this.type == null) {
      this.type = 'string';
    }

    return `-D${this.name}:${this.type}="${this.value}"`;
  }
}

class Variable {
  constructor(public name: string, public value: string) { }

  public toString(): string {
    return `{var: '${this.name}'='${this.value}'}`;
  }
}

export class Environment {
  constructor(public name: string, public variables: Variable[]) { }

  public toString(): string {
    let varsString: string = "";
    for (const variable of this.variables) {
      varsString += String(variable) + ", ";
    }
    return `{env: '${this.name}', variables=${varsString}}`;
  }
}

export class Configuration {
  variables: CMakeVariable[];
  inheritEnvironments: string[];
  buildDir: string;
  cmakeArgs: string;
  makeArgs: string;
  generator: string;
  type: string;
  workspaceRoot: string;
  cmakeSettingsJsonPath: string;
  cmakeToolchain: string;

  constructor(public readonly name: string, public readonly environments: EnvironmentMap) {
  }

  public toString(): string {
    return `{conf: ${this.name}:${this.type}}`;
  }
}

export class PropertyEvaluator {
  // Matches the variable name in "${variable.name}".
  private varExp = new RegExp("\\$\{([^\{\}]+)\}", "g");
  private localEnv: Environment = new Environment("", []);

  public constructor(public config: Configuration, public globalEnvs: EnvironmentMap) {
    this.createLocalVars();
  }

  private addToLocalEnv(name: string, value: string) {
    this.localEnv.variables.push(new Variable(name, value));
  }

  private createLocalVars() {
    this.addToLocalEnv('name', this.config.name);
    this.addToLocalEnv('generator', this.config.generator);
    this.addToLocalEnv('workspaceRoot', this.config.workspaceRoot);
    this.addToLocalEnv('thisFile', this.config.cmakeSettingsJsonPath);
    this.addToLocalEnv(
      'projectFile',
      path.join(
        path.dirname(this.config.cmakeSettingsJsonPath), 'CMakeLists.txt'));
    this.addToLocalEnv(
      'projectDir', path.dirname(this.config.cmakeSettingsJsonPath));
    this.addToLocalEnv(
      'projectDirName', path.basename(path.dirname(this.config.cmakeSettingsJsonPath)));
    this.addToLocalEnv(
      'workspaceHash',
      crypto.createHash('md5')
        .update(this.config.cmakeSettingsJsonPath)
        .digest('hex'));
  }

  private searchVariable(variable: string, env: Environment): string | null {
    if (env != null) {
      for (const v of env.variables) {
        if (v.name == variable) {
          return v.value ?? "";
        }
      }
    }
    return null;
  }

  private evaluateVariable(variable: Variable): string | null {
    tl.debug(`Searching ${variable.name} in environment ${this.localEnv} ...`);
    let res = this.searchVariable(variable.name, this.localEnv);
    if (res !== null) {
      return res;
    }

    for (let localName of this.config.inheritEnvironments) {
      let env = this.config.environments[localName];
      res = this.searchVariable(variable.name, env);
      if (res !== null) {
        return res;
      }
    }

    let env = this.config.environments['unnamed'];
    res = this.searchVariable(variable.name, env);
    if (res !== null) {
      return res;
    }

    for (let localName of this.config.inheritEnvironments) {
      let env = this.globalEnvs[localName];
      res = this.searchVariable(variable.name, env);
      if (res !== null)
        return res;
    }

    env = this.globalEnvs['unnamed'];
    res = this.searchVariable(variable.name, env);
    if (res !== null)
      return res;

    // Try to match an environment variable.
    if (variable.name.startsWith("env.")) {
      const envVarName: string = variable.name.substring(4);
      const value = process.env[envVarName];
      if (value) {
        return value;
      }
    }
    return null;
  }

  private extractVariables(str: string): Variable[] | null {
    let variables: Variable[] = [];
    while (true) {
      const match = this.varExp.exec(str);
      if (match == null) break;
      if (match.length > 1) {
        let varname = match[1];
        let variable: Variable =
          new Variable(varname, '');
        variables.push(variable);
      }
    }

    return variables;
  }

  private evaluateExpression(expr: string): string {
    tl.debug(`evaluating expression: '${expr}' ...`)
    let res: string = expr;
    while (true) {
      let variables = this.extractVariables(res);
      if (variables != null) {
        let resolved: boolean;
        resolved = false;
        for (const variable of variables) {
          const resv = this.evaluateVariable(variable);
          if (resv != null) {
            res = res.replace('${' + variable.name + '}', resv);
            tl.debug(`evaluated \$\{${variable.name}\} to '${resv}'`);
            resolved = true;
          } else {
            tl.debug(`Warning: could not evaluate '${variable.toString()}'`)
          }
        }

        if (resolved == false) {
          break;
        }
      }
    }

    tl.debug(`evalutated to: '${String(res)}'.`);
    return res ?? '';
  }

  public evaluate(): void {
    this.config.cmakeToolchain = this.evaluateExpression(this.config.cmakeToolchain);
    this.config.buildDir = this.evaluateExpression(this.config.buildDir);
    this.config.cmakeArgs = this.evaluateExpression(this.config.cmakeArgs);
    this.config.makeArgs = this.evaluateExpression(this.config.makeArgs);
    this.config.type = this.evaluateExpression(this.config.type);
    this.config.generator = this.evaluateExpression(this.config.generator);
    for (let variable of this.config.variables) {
      variable.value = this.evaluateExpression(variable.value);
    }
  }
}

export class CMakeSettingsJsonRunner {
  globalEnvironments: Environment[];
  static readonly ARM64: [string, string] = ["ARM64", "ARM64"];
  static readonly ARM: [string, string] = ["ARM", "ARM"];
  static readonly X64: [string, string] = ["x64", "x64"];
  static readonly WIN64: [string, string] = ["Win64", "x64"];
  static readonly WIN32: [string, string] = ["Win32", "Win32"];

  constructor(private cmakeSettingsJson: any, private configurationFilter: string, buildArgs: string, private workspaceRoot: string, private vcpkgTriplet: string, private useVcpkgToolchain: boolean, private doBuild: boolean, private ninjaPath: string, private sourceScript: string, private buildDir: string) {
    this.configurationFilter = configurationFilter;
  }

  private static parseEnvironments(envsJson: any): EnvironmentMap {
    return parseEnvironments(envsJson);
  }

  private parseConfigurations(json: any): Configuration[] {
    const configurations: Configuration[] = parseConfigurations(json, this.cmakeSettingsJson);
    tl.debug(tl.loc('ParsedConfigurations', String(configurations)));

    return configurations;
  }

  parseGlobalEnvironments(json: any): EnvironmentMap {
    // Parse global environments
    let globalEnvs: EnvironmentMap = {};
    if (json.environments != null) {
      globalEnvs = CMakeSettingsJsonRunner.parseEnvironments(json.environments);
    }
    tl.debug(tl.loc('ParsedGlobalEnvironments'));
    for (const envName in globalEnvs) {
      tl.debug(`'${envName}'=${String(globalEnvs[envName])}`);
    }

    return globalEnvs;
  }

  getGeneratorArgs(gen: string): string {
    if (gen.includes("Visual Studio")) {
      // for VS generators, add the -A value
      let architectureParam: string | undefined = undefined;
      let generatorParam: string = "Visual Studio 16 2019";

      const architectures: [string, string][] = [
        CMakeSettingsJsonRunner.X64,
        CMakeSettingsJsonRunner.WIN32,
        CMakeSettingsJsonRunner.WIN64,
        CMakeSettingsJsonRunner.ARM64, // Note ARM64 must be replaced before ARM!
        CMakeSettingsJsonRunner.ARM
      ];

      // Remove the platform 
      for (let architecture of architectures) {
        if (gen.includes(architecture[0])) {
          gen = gen.replace(architecture[0], "");
          architectureParam = architecture[1];
        }
      }

      gen = `-G \"${gen.trim()}\"`;

      if (architectureParam) {
        gen += ` -A ${architectureParam}`
      }
    }
    else {
      // All non-VS generators are passed as is.
      gen = `-G "${gen}"`;
    }

    return gen;
  }

  async run(): Promise<void> {
    let content: any = fs.readFileSync(this.cmakeSettingsJson);
    // Remove any potential BOM at the beginning.
    content = content.toString().trimLeft();
    tl.debug(tl.loc('CMakeSettingsContent', content));
    // Strip any comment out of the JSON content.
    let cmakeSettingsJson: any = JSON.parse(stripJsonComments(content));

    let configurations = this.parseConfigurations(cmakeSettingsJson);
    let globalEnvs = this.parseGlobalEnvironments(cmakeSettingsJson);

    let regex = new RegExp(this.configurationFilter);
    let filteredConfigurations: Configuration[] = configurations.filter(configuration => {
      return regex.test(configuration.name);
    });

    tl.debug(
      tl.loc('CMakeSettingsFilteredConfigurations', String(filteredConfigurations)));

    if (filteredConfigurations.length == 0) {
      throw new Error(tl.loc(
        'CMakeSettingsNoMatchingConfiguration', this.configurationFilter));
    }

    let exitCodes: number[] = [];
    for (const configuration of filteredConfigurations) {
      console.log(tl.loc('ConfiguringConfig', configuration.name));
      let cmakeArgs: string = ' ';

      // Search for CMake tool and run it
      let cmake: trm.ToolRunner;
      if (this.sourceScript) {
        cmake = tl.tool(this.sourceScript);
        cmakeArgs += tl.which('cmake', true);
      }
      else {
        cmake = tl.tool(tl.which('cmake', true));
      }

      // Evaluate all variables in the configuration.
      let evaluator: PropertyEvaluator =
        new PropertyEvaluator(configuration, globalEnvs);
      evaluator.evaluate();

      // The build directory value specified in CMakeSettings.json is ignored.
      // This is because:
      // 1. you want to build targeting an empty binary directory;
      // 2. the default in CMakeSettings.json is under the source tree, which is not cleared upon each build run.
      // Instead if users did not provided a specific path, force it to 
      // "$(Build.ArtifactStagingDirectory)/{name}" which should be empty.
      console.log(`Note: the run-cmake task always ignore the 'buildRoot' value specified in the CMakeSettings.json (buildRoot=${configuration.buildDir}).`);
      if (this.buildDir === utils.getArtifactsDir()) {
        // The build directory goes into the artifact directory in a subdir
        // named with the configuration name.
        configuration.buildDir = path.join(utils.getArtifactsDir(), configuration.name);
      }
      else {
        configuration.buildDir = this.buildDir;
      }

      cmakeArgs += " " + this.getGeneratorArgs(configuration.generator);

      if (utils.isNinjaGenerator(cmakeArgs)) {
        let ninjaPath: string = ninjalib.retrieveNinjaPath(this.ninjaPath);
        cmakeArgs += ` -DCMAKE_MAKE_PROGRAM="${ninjaPath}"`;
      }

      cmakeArgs += ` -DCMAKE_BUILD_TYPE="${configuration.type}"`;
      for (const variable of configuration.variables) {
        cmakeArgs += ' ' + variable.toString();
      }

      if (configuration.cmakeToolchain) {
        cmakeArgs += ` -DCMAKE_TOOLCHAIN_FILE="${configuration.cmakeToolchain}"`;
      }

      // Use vcpkg toolchain if requested.
      if (this.useVcpkgToolchain === true) {
        cmakeArgs = await utils.injectVcpkgToolchain(cmakeArgs, this.vcpkgTriplet)
      }

      // Add CMake args from CMakeSettings.json file.
      cmakeArgs += " " + configuration.cmakeArgs;

      // Set the source directory
      cmakeArgs += " " + path.dirname(this.cmakeSettingsJson);

      // Run CNake with the given arguments.
      if (!configuration.buildDir) {
        throw new Error(tl.loc('BuildDirNull'));
      }
      tl.mkdirP(configuration.buildDir);
      cmake.line(cmakeArgs);

      let options = <trm.IExecOptions>{
        cwd: configuration.buildDir,
        failOnStdErr: false,
        errStream: process.stdout,
        outStream: process.stdout,
        ignoreReturnCode: true,
        silent: false,
        windowsVerbatimArguments: false,
        env: process.env
      };

      tl.debug(`Generating project files with CMake in build directory '${options.cwd}' ...`);
      let code: number = await cmake.exec(options);
      if (code != 0) {
        throw new Error(tl.loc('BuildFailed', code));
      }

      if (this.doBuild) {
        await utils.build(configuration.buildDir,
          // CMakeSettings.json contains in buildCommandArgs the arguments to the make program only.
          // They need to be put after '--', otherwise would be passed to directly to cmake.
          ` -- ${configuration.makeArgs}`,
          options);
      }
    }
  }
}

export function parseConfigurations(json: any, cmakeSettingsJson: string): Configuration[] {
  // Parse all configurations.
  let configurations: Configuration[] = [];
  if (json.configurations != null) {
    for (const configuration of json.configurations) {
      // Parse variables.
      let vars: CMakeVariable[] = [];
      if (configuration.variables != null) {
        for (const variable of configuration.variables) {
          const data: CMakeVariable =
            new CMakeVariable(variable.name, variable.value, variable.type);
          vars.push(data);
        };
      }

      // Parse inherited environments.
      let inheritedEnvs: string[] = [];
      if (configuration.inheritEnvironments != null) {
        for (const env of configuration.inheritEnvironments) {
          inheritedEnvs.push(env);
        }
      }

      // Parse local environments.
      let localEnvs: EnvironmentMap = {};
      if (configuration.environments != null) {
        localEnvs = parseEnvironments(configuration.environments);
      }

      const newConfiguration: Configuration = new Configuration(
        configuration.name, localEnvs);
      newConfiguration.variables = vars;
      newConfiguration.inheritEnvironments = inheritedEnvs;
      newConfiguration.buildDir = configuration.remoteMachineName ? configuration.remoteBuildRoot : configuration.buildRoot;
      newConfiguration.cmakeArgs = configuration.cmakeCommandArgs;
      newConfiguration.makeArgs = configuration.buildCommandArgs;
      newConfiguration.type = configuration.configurationType;
      newConfiguration.generator = configuration.generator;
      newConfiguration.workspaceRoot = utils.getSourceDir();
      // Set the Configuration.cmakeSettingsJsonPath field value with the one passed in.
      newConfiguration.cmakeSettingsJsonPath = cmakeSettingsJson;
      newConfiguration.cmakeToolchain = configuration.cmakeToolchain;
      configurations.push(newConfiguration);
    } //for
  }

  return configurations;
}

export function parseEnvironments(envsJson: any): EnvironmentMap {
  let environments: EnvironmentMap = {};
  for (let env of envsJson) {
    let namespace: string = 'env';
    let name: string = 'unnamed';
    let variables: Variable[] = [];
    for (let envi in env) {
      if (envi == 'environment')
        name = env[envi];
      else if (envi == 'namespace')
        namespace = env[envi];
      else { variables.push(new Variable(envi, env[envi])); }
    }

    // Prepend namespace to all variables.
    for (let v of variables) {
      if (!v.name.includes('.')) {
        if (namespace != null && namespace.length > 0) {
          v.name = namespace + '.' + v.name;
        }

      }
    }

    if (name in environments) {
      // Append entries to existing variables.
      environments[name].variables = environments[name].variables.concat(variables);
    } else {
      // Create a new environment.
      let env: Environment = new Environment(name, variables);
      environments[name] = env;
    }
  }

  return environments;
}
