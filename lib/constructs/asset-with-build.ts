import { execSync } from "child_process"
import { Construct } from "constructs"
import * as cdk from "aws-cdk-lib"
import * as s3_assets from "aws-cdk-lib/aws-s3-assets"

export type AssetWithBuildProps = Omit<s3_assets.AssetProps, "bundling"> & {
	/** Function specifying how contents at the Asset's path prop should be built. */
	build?: (
		/** Function for executing a command. */
		exec: (
			/** The command to be executed. */
			command: string,
			options?: {
				/** Extra environment variables to be present for the command's execution. */
				env?: Record<string, string>
			}) => void,
		/** The directory which the built content should be sent to. */
		outputDir: string
	) => void
}

/**
 * An extension of the [Asset](
 * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3_assets-readme.html) construct for
 * conveniently building your app. It simplifies Asset's `bundling` prop with its own `build` prop
 * which allows directly specifying a series of commands to run.
 */
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
	if (props.build !== undefined) {
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
		props.build(exec, outputDir)
	}
}
