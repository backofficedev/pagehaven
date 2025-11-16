type EnvOrValue<T> = T | (() => T | undefined);

class Configuration {
	private config: {
		apiKey?: EnvOrValue<string>;
		clientId?: EnvOrValue<string>;
		cookiePassword?: EnvOrValue<string>;
		cookieName?: EnvOrValue<string>;
		cookieMaxAge?: EnvOrValue<number>;
		cookieDomain?: EnvOrValue<string>;
		apiHostname?: EnvOrValue<string>;
		https?: EnvOrValue<boolean>;
		port?: EnvOrValue<number>;
		redirectUri?: EnvOrValue<string>;
	} = {};

	configure(config: {
		apiKey?: EnvOrValue<string>;
		clientId?: EnvOrValue<string>;
		cookiePassword?: EnvOrValue<string>;
		cookieName?: EnvOrValue<string>;
		cookieMaxAge?: EnvOrValue<number>;
		cookieDomain?: EnvOrValue<string>;
		apiHostname?: EnvOrValue<string>;
		https?: EnvOrValue<boolean>;
		port?: EnvOrValue<number>;
		redirectUri?: EnvOrValue<string>;
	}) {
		this.config = config;
	}

	getValue<T>(key: keyof typeof this.config, defaultValue?: T): T | undefined {
		const value = this.config[key];
		if (typeof value === "function") {
			return (value() ?? defaultValue) as T;
		}
		return (value ?? defaultValue) as T;
	}
}

const configuration = new Configuration();

export function configure(
	config: Parameters<typeof configuration.configure>[0],
) {
	configuration.configure(config);
}

export function getConfig<T>(
	key: Parameters<typeof configuration.getValue>[0],
	defaultValue?: T,
): T | undefined {
	return configuration.getValue(key, defaultValue);
}

// Default configuration with environment variables
configure({
	apiKey: () => process.env.WORKOS_API_KEY,
	clientId: () => process.env.WORKOS_CLIENT_ID,
	cookiePassword: () => process.env.WORKOS_COOKIE_PASSWORD,
	cookieName: "wos-session",
	cookieMaxAge: 400 * 24 * 60 * 60, // 400 days in seconds
	apiHostname: "api.workos.com",
	https: true,
	redirectUri: () => process.env.WORKOS_REDIRECT_URI,
});
