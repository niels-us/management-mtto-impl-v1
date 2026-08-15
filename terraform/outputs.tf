output "dynamodb_table_name" {
  description = "DynamoDB table name. Used to set DYNAMODB_TABLE_NAME."
  value       = module.backend.dynamodb_table_name
}

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = module.backend.dynamodb_table_arn
}

output "iam_role_arn" {
  description = "IAM Role ARN for Lambda. Paste this in config/serverless/common-custom-config.yaml under role.DESA"
  value       = module.backend.iam_role_arn
}

output "s3_deployment_bucket" {
  description = "S3 bucket name for Serverless Framework deployments"
  value       = module.backend.s3_deployment_bucket
}

output "ssm_dynamodb_table_path" {
  description = "SSM path for the DynamoDB table name"
  value       = module.backend.ssm_dynamodb_table_path
}

output "frontend_bucket_name" {
  description = "S3 bucket name for frontend hosting. Use this in CI/CD to sync built files"
  value       = module.frontend.bucket_name
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name. Access the frontend at this URL"
  value       = module.frontend.cloudfront_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID. Use this for invalidations in CI/CD"
  value       = module.frontend.cloudfront_distribution_id
}

output "next_steps" {
  description = "Steps to complete deployment after terraform apply"
  value       = <<-EOT
    1. Seed the DynamoDB table (once):
       cd backend
       DYNAMODB_TABLE_NAME=${module.backend.dynamodb_table_name} pnpm run seed:dynamo

    2. Update serverless.yaml — SSM references are already wired:
       JWT_SECRET:             ${module.backend.ssm_jwt_secret_path}
       DYNAMODB_TABLE_NAME:    ${module.backend.ssm_dynamodb_table_path}
       GROQ_API_KEY:           ${module.backend.ssm_groq_api_key_path}

    3. Update config/serverless/common-custom-config.yaml:
       role.DESA: ${module.backend.iam_role_arn}
       Remove vpc.DESA block (Lambda runs without VPC)

    4. Deploy backend:
       pnpm run sls-deploy

    5. Deploy frontend code to S3 (infra already created):
       cd ../frontend
       pnpm run build
       aws s3 sync dist/ s3://${module.frontend.bucket_name}/ --delete

    6. (Optional) Invalidate CloudFront cache after frontend deploy:
       aws cloudfront create-invalidation \\
         --distribution-id ${module.frontend.cloudfront_distribution_id} \\
         --paths "/*"

    ─── Frontend URL: https://${module.frontend.cloudfront_domain_name}
  EOT
}
