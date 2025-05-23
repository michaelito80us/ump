// @ump/infra-scripts - Infrastructure and deployment scripts

export interface ScriptConfig {
  environment: 'development' | 'staging' | 'production';
  verbose: boolean;
}

export const runScript = (name: string, config: ScriptConfig): void => {
  process.stdout.write(
    `Running script: ${name} in ${config.environment} mode\n`
  );
};

export const SCRIPTS_VERSION = '0.1.0';
