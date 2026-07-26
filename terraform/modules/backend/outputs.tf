output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint (host)"
  value       = aws_db_instance.postgres.address
}

output "rds_port" {
  description = "RDS PostgreSQL port"
  value       = aws_db_instance.postgres.port
}

output "iam_role_arn" {
  description = "IAM Role ARN for Lambda"
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

output "ssm_jwt_secret_path" {
  description = "SSM path for JWT secret"
  value       = aws_ssm_parameter.jwt_secret.name
}

output "ssm_groq_api_key_path" {
  description = "SSM path for Groq API key"
  value       = aws_ssm_parameter.groq_api_key.name
}
