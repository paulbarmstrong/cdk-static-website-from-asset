import { execSync } from "child_process"
import { Construct } from "constructs"
import * as cdk from "aws-cdk-lib"
import * as s3_assets from "aws-cdk-lib/aws-s3-assets"

type AssetWithBuildProps = Omit<s3_assets.AssetProps, "bundling"> & {
	build?: (exec: (command: string, options?: { env?: Record<string, string> }) => void, outputDir: string) => void
}

export class AssetWithBuild extends s3_assets.Asset {
	constructor(scope: Construct, id: string, props: AssetWithBuildProps) {
		super(scope, id, {
			...props,
			bundling: {
				local: {
					tryBundle: (outputDir: string, options: cdk.BundlingOptions) => {
						bundle(props, outputDir)
						return true
					}
				},
				image: cdk.DockerImage.fromRegistry("alpine")
			}
		})
	}
}

function bundle(props: AssetWithBuildProps, outputDir: string) {
	const exec = (command: string, options?: { env?: Record<string, string>}) => {
		try {
			execSync(command, {
				cwd: props.path,
				env: {
					...process.env,
					...options?.env
				},
				stdio: "pipe"
			})
		} catch (error) {
			if ((error as any).stdout) process.stdout.write((error as any).stdout)
			if ((error as any).stderr) process.stdout.write((error as any).stderr)
			throw error
		}
	}
	if (props.build !== undefined) props.build(exec, outputDir)
}
