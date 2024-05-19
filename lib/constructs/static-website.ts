import { Construct } from "constructs"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import * as iam from "aws-cdk-lib/aws-iam"
import * as s3_assets from "aws-cdk-lib/aws-s3-assets"
import * as cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as logs from "aws-cdk-lib/aws-logs"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as route53_targets from "aws-cdk-lib/aws-route53-targets"
import { BucketObject, BucketWithObjects, BucketWithObjectsProps, DeploymentAction } from "cdk-bucket-with-objects"
import { DnsValidatedCertificate } from "@trautonen/cdk-dns-validated-certificate"

export type StaticWebsiteProps = {
	asset: s3_assets.Asset,
	indexDocument: string,
	hostedZone?: route53.IHostedZone,
	domainName?: string,
	bucketProps?: Partial<s3.BucketProps & BucketWithObjectsProps>,
	distributionProps?: Partial<cloudfront.DistributionProps>,
	deploymentLogGroup?: logs.ILogGroup
}

export class StaticWebsite extends Construct {
	bucket: s3.Bucket
	#bucketInternal: BucketWithObjects
	distribution: cloudfront.Distribution
	constructor(scope: Construct, id: string, props: StaticWebsiteProps) {
		super(scope, id)
		if (props.domainName !== undefined && props.hostedZone === undefined) {
			throw new Error("Cannot provide domainName without hostedZone.")
		}

		const domainName = props.hostedZone !== undefined ? (
			props.domainName !== undefined ? props.domainName : props.hostedZone.zoneName
		) : (
			undefined
		)

		const certificate = props.hostedZone !== undefined ? (
			new DnsValidatedCertificate(this, "Certificate", {
				domainName: domainName!,
				validationHostedZones: [{ hostedZone: props.hostedZone }],
				certificateRegion: "us-east-1"
			})
		) : (
			undefined
		)

		this.#bucketInternal = new BucketWithObjects(this, "Bucket", {
			blockPublicAccess: {
				blockPublicPolicy: false,
				blockPublicAcls: false,
				ignorePublicAcls: false,
				restrictPublicBuckets: false
			},
			websiteIndexDocument: props.indexDocument,
			deploymentLogGroup: props.deploymentLogGroup,
			...props.bucketProps
		})
		this.bucket = this.#bucketInternal
		this.bucket.addToResourcePolicy(new iam.PolicyStatement({
			principals: [new iam.StarPrincipal()],
			actions: ["s3:GetObject"],
			resources: [`arn:aws:s3:::${this.bucket.bucketName}/*`]
		}))

		this.distribution = new cloudfront.Distribution(this, "Distribution", {
			defaultBehavior: {
				origin: new cloudfront_origins.S3Origin(this.bucket)
			},
			errorResponses: [
				{
					httpStatus: 403,
					responsePagePath: `/${props.indexDocument}`,
					responseHttpStatus: 200
				}, {
					httpStatus: 404,
					responsePagePath: `/${props.indexDocument}`,
					responseHttpStatus: 200
				}
			],
			domainNames: domainName !== undefined ? [domainName] : undefined,
			certificate: certificate,
			...props.distributionProps
		})

		new route53.ARecord(this, "DistributionARecord", {
			zone: props.hostedZone!,
			target: route53.RecordTarget.fromAlias(new route53_targets.CloudFrontTarget(this.distribution))
		})

		this.#bucketInternal.addObjectsFromAsset(props.asset)
		this.#bucketInternal.addDeploymentAction(DeploymentAction.cloudFrontDistributionInvalidation(this.distribution))
	}

	addBucketObject(object: BucketObject) {
		this.#bucketInternal.addObject(object)
	}
}

