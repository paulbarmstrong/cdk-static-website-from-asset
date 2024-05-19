import { execSync } from "child_process"
import { readdirSync } from "fs"
import { Construct } from "constructs"
import * as cdk from "aws-cdk-lib"
import * as s3_assets from "aws-cdk-lib/aws-s3-assets"

type ReactAppAssetProps = Omit<s3_assets.AssetProps, "bundling"> & {
	environment?: Record<string, string>
	buildEnvironment?: Record<string, string>
}

export class ReactAppAsset extends s3_assets.Asset {
	constructor(scope: Construct, id: string, props: ReactAppAssetProps) {
		super(scope, id, {
			...props,
			bundling: {
				local: {
					tryBundle: (outputDir: string, options: cdk.BundlingOptions) => {
						buildReactApp(props, outputDir)
						return true
					}
				},
				image: cdk.DockerImage.fromRegistry("alpine")
			}
		})
	}
}

function buildReactApp(props: ReactAppAssetProps, buildPath: string) {
	const reactAppEnvironmentEntries: Record<string, string> | undefined = props.environment ? (
		(Object.fromEntries(Object.entries(props.environment).map(entry => [`REACT_APP_${entry[0]}`, entry[1]])))
	) : (
		undefined
	)
	try {
		if (!readdirSync(props.path).includes("node_modules")) {
			execSync("npm install", { cwd: props.path, stdio: "pipe" })
		}
		execSync("npx react-scripts build --color=always", {
			env: {
				...process.env,
				...props.buildEnvironment,
				...reactAppEnvironmentEntries,
				BUILD_PATH: buildPath
			},
			cwd: props.path,
			stdio: "pipe"
		})
	} catch (error) {
		if ((error as any).stdout) process.stdout.write((error as any).stdout)
		if ((error as any).stderr) process.stdout.write((error as any).stderr)
		throw new Error("React app build failed.")
	}
}
