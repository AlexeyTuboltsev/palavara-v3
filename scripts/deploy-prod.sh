envFile=$(pwd)/.env.production
bucketName="$(dotenv --file=$envFile get BUCKET_NAME)"
distributionId="$(dotenv --file=$envFile get DISTRIBUTION_ID)"

echo "--deploying to PRODUCTION: $bucketName --"

aws s3 sync build/ s3://$bucketName
aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*"