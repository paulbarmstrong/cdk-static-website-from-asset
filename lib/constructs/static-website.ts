import { Construct } from "constructs"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import * as iam from "aws-cdk-lib/aws-iam"
import * as s3_assets from "aws-cdk-lib/aws-s3-assets"
import * as cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as route53_targets from "aws-cdk-lib/aws-route53-targets"
import { ManagedObjectsBucket, ManagedObjectsBucketProps, ObjectChangeAction } from "cdk-managed-objects-bucket"
import { DnsValidatedCertificate } from "aws-cdk-lib/aws-certificatemanager"

export type StaticWebsiteProps = {
	asset: s3_assets.Asset,
	indexDocument: string,
	route53Domains?: Array<{
		domainName: string,
		hostedZone: route53.IHostedZone
	}>,
	waitForCloudFrontInvalidationCompletion?: boolean
	bucketProps?: Partial<s3.BucketProps & ManagedObjectsBucketProps>,
	distributionProps?: Partial<cloudfront.DistributionProps>,
}

export class StaticWebsite extends Construct {
	bucket: s3.Bucket
	#bucketInternal: ManagedObjectsBucket
	distribution: cloudfront.Distribution
	constructor(scope: Construct, id: string, props: StaticWebsiteProps) {
		super(scope, id)

		const domains = props.route53Domains !== undefined ? props.route53Domains : []

		if (domains.length > 1) {
			throw new Error("Multiple route53 domains isn't supported yet.")
		}

		if (new Set(domains.map(domain => domain.domainName)).size !== domains.length) {
			throw new Error("Domain names must be unique.")
		}

		const certificate = domains.length > 0 ? (
			new DnsValidatedCertificate(this, "Certificate", {
				domainName: domains[0].domainName,
				hostedZone: domains[0].hostedZone,
				region: "us-east-1"
			})
		) : (
			undefined
		)

		this.#bucketInternal = new ManagedObjectsBucket(this, "Bucket", {
			blockPublicAccess: {
				blockPublicPolicy: false,
				blockPublicAcls: false,
				ignorePublicAcls: false,
				restrictPublicBuckets: false
			},
			websiteIndexDocument: props.indexDocument,
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
			domainNames: domains.map(domain => domain.domainName),
			certificate: certificate,
			...props.distributionProps
		})

		domains.forEach(domain => {
			new route53.ARecord(this, `${domain.domainName}ARecord`, {
				zone: domain.hostedZone!,
				recordName: domain.domainName,
				target: route53.RecordTarget.fromAlias(new route53_targets.CloudFrontTarget(this.distribution))
			})
		})
		this.#bucketInternal.addObjectsFromAsset({ asset: props.asset })
		this.#bucketInternal.addObjectChangeAction(ObjectChangeAction.cloudFrontInvalidation({
			distribution: this.distribution,
			waitForCompletion: props.waitForCloudFrontInvalidationCompletion
		}))
	}

	addBucketObject(props: { key: string, body: string }) {
		this.#bucketInternal.addObject(props)
	}
}
