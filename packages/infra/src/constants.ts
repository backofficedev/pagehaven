import { APP_NAME_KEYS, getEnv } from "@pagehaven/config/env";

const resourceName = "worker";

type InfraName = Record<(typeof APP_NAME_KEYS)[number], string> & {
  SHARED_RESOURCE_PREFIX: string;
  RESOURCE_NAME: string;
};

let _infraName: InfraName;

export function getInfraName() {
  if (!_infraName) {
    _infraName = buildInfraName();
  }
  return _infraName;
}

export function buildInfraName() {
  const env = getEnv();
  const APP_NAME_PREFIX = env.REPO_NAME;

  return {
    SHARED_RESOURCE_PREFIX: APP_NAME_PREFIX,
    SERVER_APP_NAME: `${APP_NAME_PREFIX}-${env.SERVER_RESOURCE_NAME}`,
    STATIC_APP_NAME: `${APP_NAME_PREFIX}-${env.STATIC_RESOURCE_NAME}`,
    WEB_APP_NAME: `${APP_NAME_PREFIX}-${env.WEB_RESOURCE_NAME}`,
    RESOURCE_NAME: resourceName,
  } as const;
}

export function validateInfraEnv() {
  const env = getEnv();
  const infraName = getInfraName();

  const buildMismatchError = (
    appName: string,
    built: string,
    expected: string
  ) => new Error(`${appName} mismatch: built '${built}' != env '${expected}'`);

  // Validate that built app names match the environment app names
  for (const appName of APP_NAME_KEYS) {
    const builtName = infraName[appName];
    const envName = env[appName];

    if (builtName !== envName) {
      throw buildMismatchError(appName, builtName, envName);
    }
  }
}
