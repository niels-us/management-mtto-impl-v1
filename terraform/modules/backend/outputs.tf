output "iam_role_arn" {
  description = "IAM Role ARN for Lambda"
  value       = aws_iam_role.lambda_exec.arn
}

output "s3_deployment_bucket" {
  description = "S3 bucket name for Serverless Framework deployments"
  value       = aws_s3_bucket.deployment.id
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.maintenance.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.maintenance.arn
}

output "ssm_dynamodb_table_path" {
  description = "SSM path for the DynamoDB table name"
  value       = aws_ssm_parameter.dynamodb_table_name.name
}

output "ssm_jwt_secret_path" {
  description = "SSM path for JWT secret"
  value       = aws_ssm_parameter.jwt_secret.name
}

output "ssm_groq_api_key_path" {
  description = "SSM path for Groq API key"
  value       = aws_ssm_parameter.groq_api_key.name
}
