output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint (host). Use this to verify connection."
  value       = aws_db_instance.postgres.address
}

output "rds_port" {
  description = "RDS PostgreSQL port"
  value       = aws_db_instance.postgres.port
}

output "iam_role_arn" {
  description = "IAM Role ARN for Lambda. Paste this in config/serverless/common-custom-config.yaml under role.DESA"
  value       = aws_iam_role.lambda_exec.arn
}

output "s3_deployment_bucket" {
  description = "S3 bucket name for Serverless Framework deployments"
  value       = aws_s3_bucket.deployment.id
}

output "ssm_postgresql_path" {
  description = "SSM path for PostgreSQL credentials"
  value       = aws_ssm_parameter.postgresql_credentials.name
}

output "next_steps" {
  description = "Steps to complete deployment after terraform apply"
  value       = <<-EOT
    1. Run init.sql on RDS:
       PGPASSWORD=<db_password> psql -h ${aws_db_instance.postgres.address} -U postgres -d kfinder -f init.sql

    2. Update serverless.yaml — uncomment SSM references:
       JWT_SECRET:               ${aws_ssm_parameter.jwt_secret.name}
       POSTGRESQL_CREDENTIALS:  ${aws_ssm_parameter.postgresql_credentials.name}
       GROQ_API_KEY:             ${aws_ssm_parameter.groq_api_key.name}

    3. Update config/serverless/common-custom-config.yaml:
       role.DESA: ${aws_iam_role.lambda_exec.arn}
       Remove vpc.DESA block (Lambda runs without VPC)

    4. Deploy:
       npm run build
       serverless deploy --stage DESA --region us-east-1
  EOT
}
